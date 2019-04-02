import {
  IRequestAttestationForClaim,
  RequestForAttestation,
  MessageBodyType,
  Attestation,
  AttestedClaim,
  Blockchain,
  ISubmitAttestationForClaim,
  IClaim,
  IRequestForAttestation,
  IPartialClaim,
  IRequestLegitimations,
  IAttestedClaim,
  ISubmitLegitimations,
} from '@kiltprotocol/prototype-sdk'

import { MyIdentity, Contact } from '../../types/Contact'

import MessageRepository from '../../services/MessageRepository'
import BlockchainService from '../../services/BlockchainService'
import AttestationService from '../../services/AttestationService'
import AttestationWorkflow from '../../services/AttestationWorkflow'

import * as Attestations from '../../state/ducks/Attestations'
import { MyDelegation } from '../../state/ducks/Delegations';

import { toContact } from './DevTools.utils'
import { storeAttestationForClaim } from './DevTools.claims'

export const requestAttestationForClaim = (
  claim: IClaim,
  from: MyIdentity,
  to: MyIdentity,
  legitimations: AttestedClaim[] = []
) => {
  const requestForAttestation = new RequestForAttestation(
    claim,
    legitimations,
    from.identity
  )

  const messageBody: IRequestAttestationForClaim = {
    content: requestForAttestation,
    type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
  }

  MessageRepository.singleSend(messageBody, from, toContact(to))

  return { requestForAttestation }
}

export const submitAttestationForClaim = async (
  requestForAttestation: IRequestForAttestation,
  from: MyIdentity,
  to: MyIdentity
) => {
  const attestation = new Attestation(requestForAttestation, from.identity)

  const attestedClaim = new AttestedClaim(requestForAttestation, attestation)

  const blockchain: Blockchain = await BlockchainService.connect()

  await attestation.store(blockchain, from.identity)

  AttestationService.saveInStore({
    attestation: attestedClaim.attestation,
    cTypeHash: attestedClaim.request.claim.cType,
    claimerAddress: attestedClaim.request.claim.owner,
    claimerAlias: to.metaData.name,
    created: Date.now(),
  } as Attestations.Entry)

  // build 'claim attested' message and send to claimer
  const attestationMessageBody: ISubmitAttestationForClaim = {
    content: attestedClaim,
    type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
  }

  MessageRepository.singleSend(attestationMessageBody, from, toContact(to))

  return { attestedClaim }
}

export const attestationWorkflow = async (
  claim: IClaim,
  claimer: MyIdentity,
  attester: MyIdentity
) => {
  const { requestForAttestation } = requestAttestationForClaim(
    claim,
    claimer,
    attester
  )

  const { attestedClaim } = await submitAttestationForClaim(
    requestForAttestation,
    attester,
    claimer
  )

  storeAttestationForClaim(attestedClaim)

  return { attestedClaim }
}

// Copied and modified from AttestationWorfklow
export const requestLegitimations = (
  claim: IPartialClaim,
  from: MyIdentity,
  to: MyIdentity
) => {
  const messageBody = {
    content: claim,
    type: MessageBodyType.REQUEST_LEGITIMATIONS,
  } as IRequestLegitimations

  MessageRepository.singleSend(messageBody, from, toContact(to))
}

// Copied and modified from AttestationWorfklow
export const submitLegitimations = (
  claim: IPartialClaim,
  legitimations: IAttestedClaim[],
  from: MyIdentity,
  to: MyIdentity,
  delegation?: MyDelegation
) => {
  const messageBody: ISubmitLegitimations = {
    content: { claim, legitimations },
    type: MessageBodyType.SUBMIT_LEGITIMATIONS,
  }

  if (delegation) {
    messageBody.content.delegationId = delegation.id
  }

  MessageRepository.singleSend(messageBody, from, toContact(to))
}

export const attestationWithLegitimationWorkflow = async (
  claim: IClaim,
  legitimations: AttestedClaim[],
  claimer: MyIdentity,
  attester: MyIdentity
) => {
  requestLegitimations(claim, claimer, attester)

  submitLegitimations(claim, legitimations, attester, claimer)

  const { requestForAttestation } = requestAttestationForClaim(
    claim,
    claimer,
    attester,
    legitimations
  )

  const { attestedClaim } = await submitAttestationForClaim(
    requestForAttestation,
    attester,
    claimer
  )

  storeAttestationForClaim(attestedClaim)
}
