import {
  AttestedClaim,
  DelegationNode,
  RequestForAttestation,
} from '@kiltprotocol/sdk-js'
import {
  IAttestedClaim,
  IClaim,
  IDelegationNode,
  IInformCreateDelegation,
  PartialClaim,
  IPublicIdentity,
  IQuoteAgreement,
  IQuoteAttesterSigned,
  IRequestAttestationForClaim,
  IRequestForAttestation,
  IRequestTerms,
  ISubmitAcceptDelegation,
  ISubmitAttestationForClaim,
  ISubmitClaimsForCTypes,
  ISubmitTerms,
  MessageBodyType,
} from '@kiltprotocol/types'

import AttestationService from './AttestationService'
import { IMyDelegation } from '../state/ducks/Delegations'
import * as Wallet from '../state/ducks/Wallet'
import { persistentStoreInstance } from '../state/PersistentStore'
import { IContact } from '../types/Contact'
import ContactRepository from './ContactRepository'
import MessageRepository from './MessageRepository'
import RequestForAttestationService from './RequestForAttestationService'

class AttestationWorkflow {
  /**
   * Sends a term request for attesting claims to attesters
   *
   * @param claims the list of partial claims we request term for
   * @param receiverAddresses the list of attester addresses to send the term request to
   */
  public static requestTerms(
    claims: PartialClaim[],
    receiverAddresses: Array<IContact['publicIdentity']['address']>
  ): void {
    const messageBodies: IRequestTerms[] = claims.map(
      (claim: PartialClaim) => ({
        content: claim,
        type: MessageBodyType.REQUEST_TERMS,
      })
    )

    return MessageRepository.multiSendToAddresses(
      receiverAddresses,
      messageBodies
    )
  }

  /**
   * Sends back the term along with the originally given (partial)
   * claim to the claimer.
   *
   * @param claim the (partial) claim to attest
   * @param legitimations the list of legitimations to be included in the
   *   attestation
   * @param receiverAddresses  list of contact addresses who will receive the term
   * @param delegation delegation to add to legitimations
   */
  public static async submitTerms(
    claim: PartialClaim,
    legitimations: IAttestedClaim[],
    receiverAddresses: Array<IContact['publicIdentity']['address']>,
    quote?: IQuoteAttesterSigned,
    receiver?: IPublicIdentity,
    delegation?: IMyDelegation
  ): Promise<void> {
    const messageBody: ISubmitTerms = {
      content: {
        claim,
        legitimations,
        delegationId: undefined,
        quote: undefined,
      },
      type: MessageBodyType.SUBMIT_TERMS,
    }
    if (delegation) {
      messageBody.content.delegationId = delegation.id
    }
    if (quote) {
      messageBody.content.quote = quote
    }

    if (receiver) {
      return MessageRepository.sendToPublicIdentity(receiver, messageBody)
    }

    return MessageRepository.sendToAddresses(receiverAddresses, messageBody)
  }

  /**
   * Sends back attested claims to verifier.
   *
   * @param attestedClaims the list of attested claims to be included in the
   *   attestation
   * @param receiverAddresses  list of contact addresses who will receive the attested claims
   */
  public static submitClaimsForCTypes(
    attestedClaims: IAttestedClaim[],
    receiverAddresses: Array<IContact['publicIdentity']['address']>
  ): Promise<void> {
    const messageBody: ISubmitClaimsForCTypes = {
      content: attestedClaims,
      type: MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES,
    }

    return MessageRepository.sendToAddresses(receiverAddresses, messageBody)
  }

  /**
   * Creates the request for claim attestation and sends it to the attester.
   *
   * @param claim - the claim to attest
   * @param attesterAddresses - the addresses of attesters
   * @param [legitimations] - the legitimations the claimer requested
   *   beforehand from attester
   * @param [delegationId] - the delegation the attester added as legitimation
   */
  public static async requestAttestationForClaim(
    claim: IClaim,
    attesterAddresses: Array<IContact['publicIdentity']['address']>,
    legitimations: AttestedClaim[] = [],
    delegationId?: IDelegationNode['id'],
    quoteAttesterSigned?: IQuoteAgreement
  ): Promise<void> {
    const selectedIdentity = Wallet.getSelectedIdentity(
      persistentStoreInstance.store.getState()
    )?.identity

    if (!selectedIdentity) {
      throw new Error('No selected Identity')
    }

    const requestForAttestation = RequestForAttestation.fromClaimAndIdentity(
      claim,
      selectedIdentity,
      { legitimations, delegationId }
    )

    attesterAddresses.forEach((attesterAddress) =>
      RequestForAttestationService.saveInStore(
        requestForAttestation,
        attesterAddress
      )
    )

    const messageBody: IRequestAttestationForClaim = {
      content: {
        requestForAttestation,
      },
      type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
    }

    if (quoteAttesterSigned) messageBody.content.quote = quoteAttesterSigned

    return MessageRepository.sendToAddresses(attesterAddresses, messageBody)
  }

  /**
   * Verifies the given request for attestation, creates an attestation on
   * chain and sends it to the claimer.
   *
   * @param requestForAttestation the request for attestation to be verified
   *   and attested
   * @param claimerAddress the contacts address who wants his claim to be attested
   */
  public static async approveAndSubmitAttestationForClaim(
    requestForAttestation: IRequestForAttestation,
    claimerAddress: IContact['publicIdentity']['address'],
    claimerIdentity?: IPublicIdentity
  ): Promise<void> {
    const claimer = ContactRepository.findByAddress(claimerAddress)
    if (!claimer && !claimerIdentity) {
      throw new Error('claimer not found')
    }
    const attestedClaim = await AttestationService.attestClaim(
      requestForAttestation
    )

    // store attestation locally
    AttestationService.saveInStore({
      attestation: attestedClaim.attestation,
      cTypeHash: attestedClaim.request.claim.cTypeHash,
      claimerAddress: attestedClaim.request.claim.owner,
      claimerAlias: (claimer && claimer.metaData.name) || '',
      created: Date.now(),
    })

    // build 'claim attested' message and send to claimer
    const attestationMessageBody: ISubmitAttestationForClaim = {
      content: {
        attestation: attestedClaim.attestation,
      },
      type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
    }

    if (claimerIdentity) {
      return MessageRepository.sendToPublicIdentity(
        claimerIdentity,
        attestationMessageBody
      )
    }

    if (claimer) {
      return MessageRepository.send([claimer], attestationMessageBody)
    }

    throw new Error('unreachable code')
  }

  /**
   * informs the delegate about the created delegation node
   *
   * @param delegationNodeId id of the just created delegation node
   * @param delegateAddress owner of the just created delegation node
   * @param delegationIsPCR is the delegation a pcr
   */
  public static async informCreateDelegation(
    delegationNodeId: DelegationNode['id'],
    delegateAddress: IContact['publicIdentity']['address'],
    delegationIsPCR: ISubmitAcceptDelegation['content']['delegationData']['isPCR']
  ): Promise<void> {
    const messageBody: IInformCreateDelegation = {
      content: {
        delegationId: delegationNodeId,
        isPCR: delegationIsPCR,
      },
      type: MessageBodyType.INFORM_CREATE_DELEGATION,
    }

    return MessageRepository.sendToAddresses([delegateAddress], messageBody)
  }
}

export default AttestationWorkflow
