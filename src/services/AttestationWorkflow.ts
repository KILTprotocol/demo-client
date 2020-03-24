import * as sdk from '@kiltprotocol/sdk-js'
import {
  IPartialClaim,
  IRequestAttestationForClaim,
  IRequestTerms,
  ISubmitAttestationForClaim,
  MessageBodyType,
} from '@kiltprotocol/sdk-js'

import AttestationService from '../services/AttestationService'
import * as Attestations from '../state/ducks/Attestations'
import { MyDelegation } from '../state/ducks/Delegations'
import * as Wallet from '../state/ducks/Wallet'
import persistentStore from '../state/PersistentStore'
import { Contact } from '../types/Contact'
import ContactRepository from './ContactRepository'
import MessageRepository from './MessageRepository'

class AttestationWorkflow {
  /**
   * Sends a term request for attesting claims to attesters
   *
   * @param claims the list of partial claims we request term for
   * @param receiverAddresses the list of attester addresses to send the term request to
   */
  public static async requestTerms(
    claims: IPartialClaim[],
    receiverAddresses: Array<Contact['publicIdentity']['address']>
  ): Promise<void> {
    const messageBodies = claims.map(
      (claim: IPartialClaim) =>
        ({
          content: claim,
          type: MessageBodyType.REQUEST_TERMS,
        } as IRequestTerms)
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
   * @param terms the list of terms to be included in the
   *   attestation
   * @param receiverAddresses  list of contact addresses who will receive the term
   * @param delegation delegation to add to terms
   */
  public static async submitTerms(
    claim: IPartialClaim,
    terms: sdk.IAttestedClaim[],
    receiverAddresses: Array<Contact['publicIdentity']['address']>,
    delegation?: MyDelegation,
    quote?: sdk.IQuoteAttesterSigned
  ): Promise<void> {
    if (quote) {
      const messageBody: sdk.ISubmitTerms = {
        content: {
          claim,
          legitimations: terms,
          delegationId: undefined,
          quote: quote,
        },
        type: sdk.MessageBodyType.SUBMIT_TERMS,
      }
      if (delegation) {
        messageBody.content.delegationId = delegation.id
      }

      return MessageRepository.sendToAddresses(receiverAddresses, messageBody)
    }
    const messageBody: sdk.ISubmitTerms = {
      content: {
        claim,
        legitimations: terms,
        delegationId: undefined,
      },
      type: sdk.MessageBodyType.SUBMIT_TERMS,
    }

    if (delegation) {
      messageBody.content.delegationId = delegation.id
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
  public static async submitClaimsForCTypes(
    attestedClaims: sdk.IAttestedClaim[],
    receiverAddresses: Array<Contact['publicIdentity']['address']>
  ): Promise<void> {
    const messageBody: sdk.ISubmitClaimsForCTypes = {
      content: attestedClaims,
      type: sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES,
    }

    return MessageRepository.sendToAddresses(receiverAddresses, messageBody)
  }

  /**
   * Creates the request for claim attestation and sends it to the attester.
   *
   * @param claim - the claim to attest
   * @param attesterAddresses - the addresses of attesters
   * @param [terms] - the terms the claimer requested
   *   beforehand from attester
   * @param [delegationId] - the delegation the attester added as legitimation
   */
  public static async requestAttestationForClaim(
    claim: sdk.IClaim,
    attesterAddresses: Array<Contact['publicIdentity']['address']>,
    terms: sdk.AttestedClaim[] = [],
    delegationId: sdk.IDelegationNode['id'] | null = null,
    quoteAgreement?: sdk.IQuoteAttesterSigned
  ): Promise<void> {
    const identity: sdk.Identity = Wallet.getSelectedIdentity(
      persistentStore.store.getState()
    ).identity
    const requestForAttestation: sdk.IRequestForAttestation = sdk.RequestForAttestation.fromClaimAndIdentity(
      claim,
      identity,
      terms,
      delegationId
    )
    if (quoteAgreement) {
      const quote = sdk.Quote.createAgreedQuote(
        identity,
        quoteAgreement,
        requestForAttestation.rootHash
      )

      const messageBody = {
        content: { requestForAttestation, quote },
        type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
      } as IRequestAttestationForClaim

      return MessageRepository.sendToAddresses(attesterAddresses, messageBody)
    }
    const messageBody = {
      content: { requestForAttestation },
      type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
    } as IRequestAttestationForClaim

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
    requestForAttestation: sdk.IRequestForAttestation,
    claimerAddress: Contact['publicIdentity']['address']
  ): Promise<void> {
    const claimer: Contact | void = await ContactRepository.findByAddress(
      claimerAddress
    )
    if (!claimer) {
      throw new Error('claimer not found')
    }
    const attestedClaim: sdk.AttestedClaim = await AttestationService.attestClaim(
      requestForAttestation
    )

    // store attestation locally
    AttestationService.saveInStore({
      attestation: attestedClaim.attestation,
      cTypeHash: attestedClaim.request.claim.cTypeHash,
      claimerAddress: attestedClaim.request.claim.owner,
      claimerAlias: claimer.metaData.name,
      created: Date.now(),
    } as Attestations.Entry)

    // build 'claim attested' message and send to claimer
    const attestationMessageBody: ISubmitAttestationForClaim = {
      content: attestedClaim,
      type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
    }
    return MessageRepository.send([claimer], attestationMessageBody)
  }

  /**
   * informs the delegate about the created delegation node
   *
   * @param delegationNodeId id of the just created delegation node
   * @param delegateAddress owner of the just created delegation node
   * @param delegationIsPCR is the delegation a pcr
   */
  public static async informCreateDelegation(
    delegationNodeId: sdk.DelegationNode['id'],
    delegateAddress: Contact['publicIdentity']['address'],
    delegationIsPCR: sdk.ISubmitAcceptDelegation['content']['delegationData']['isPCR']
  ): Promise<void> {
    const messageBody: sdk.IInformCreateDelegation = {
      content: {
        delegationId: delegationNodeId,
        isPCR: delegationIsPCR,
      },
      type: sdk.MessageBodyType.INFORM_CREATE_DELEGATION,
    }

    return MessageRepository.sendToAddresses([delegateAddress], messageBody)
  }
}

export default AttestationWorkflow
