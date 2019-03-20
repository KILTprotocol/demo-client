import * as sdk from '@kiltprotocol/prototype-sdk'
import {
  IPartialClaim,
  IRequestAttestationForClaim,
  IRequestLegitimations,
  ISubmitAttestationForClaim,
  MessageBody,
  MessageBodyType,
} from '@kiltprotocol/prototype-sdk'
import { Error } from 'tslint/lib/error'

import attestationService from '../services/AttestationService'
import * as Attestations from '../state/ducks/Attestations'
import * as Wallet from '../state/ducks/Wallet'
import persistentStore from '../state/PersistentStore'
import { Contact } from '../types/Contact'
import ContactRepository from './ContactRepository'
import errorService from './ErrorService'
import { notifyFailure, notifySuccess } from './FeedbackService'
import MessageRepository from './MessageRepository'

class AttestationWorkflow {
  /**
   * Sends a legitimation request for attesting claims to attesters
   *
   * @param claim the partial claim we request legitimation for
   * @param attesters the attesters to send the legitimation request to
   */
  public requestLegitimations(
    claim: IPartialClaim,
    attesters: Contact[]
  ): Promise<void> {
    const messageBody = {
      content: claim,
      type: MessageBodyType.REQUEST_LEGITIMATIONS,
    } as IRequestLegitimations

    return this.bulkSend(attesters, messageBody)
  }

  /**
   * Sends back the legitimation along with the originally given (partial)
   * claim to the claimer.
   *
   * @param claim the (partial) claim to attest
   * @param legitimations the list of legitimations to be included in the
   *   attestation
   * @param claimer the claimer who requested the legitimation
   */
  public submitLegitimations(
    claim: IPartialClaim,
    legitimations: sdk.AttestedClaim[],
    claimer: Contact
  ): Promise<void> {
    throw new Error('not implemented')
  }

  /**
   * Creates the request for claim attestation and sends it to the attester.
   *
   * @param claim - the claim to attest
   * @param attesters - the attesters to send the request to
   * @param [legitimations] - the legitimations the claimer requested
   *   beforehand from attester
   */
  public requestAttestationForClaim(
    claim: sdk.IClaim,
    attesters: Contact[],
    legitimations: sdk.AttestedClaim[] = []
  ): Promise<void> {
    const identity: sdk.Identity = Wallet.getSelectedIdentity(
      persistentStore.store.getState()
    ).identity
    const requestForAttestation: sdk.IRequestForAttestation = new sdk.RequestForAttestation(
      claim,
      legitimations,
      identity
    )
    const messageBody = {
      content: requestForAttestation,
      type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
    } as IRequestAttestationForClaim

    return this.bulkSend(attesters, messageBody)
  }

  /**
   * Verifies the given request for attestation, creates an attestation on
   * chain and sends it to the claimer.
   *
   * @param requestForAttestation the request for attestation to be verified
   *   and attested
   * @param claimerAddress the contacts address who wants his claim to be attested
   */
  public approveAndSubmitAttestationForClaim(
    requestForAttestation: sdk.IRequestForAttestation,
    claimerAddress: Contact['publicIdentity']['address']
  ): Promise<void> {
    return ContactRepository.findByAddress(claimerAddress).then(
      (claimer: Contact) => {
        return attestationService
          .attestClaim(requestForAttestation)
          .then((attestedClaim: sdk.IAttestedClaim) => {
            // store attestation locally
            attestationService.saveInStore({
              attestation: attestedClaim.attestation,
              cTypeHash: attestedClaim.request.claim.cType,
              claimerAddress: attestedClaim.request.claim.owner,
              claimerAlias: claimer.metaData.name,
            } as Attestations.Entry)

            // build 'claim attested' message and send to claimer
            const attestationMessageBody: ISubmitAttestationForClaim = {
              content: attestedClaim,
              type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
            }
            return MessageRepository.send(claimer, attestationMessageBody)
          })
      }
    )
  }

  /**
   * Import the attested claim to local storage.
   *
   * @param attestedClaim the attested claim to import
   */
  public importAttestedClaim(attestedClaim: sdk.IAttestedClaim): Promise<void> {
    throw new Error('not implemented')
  }

  /**
   * sends a bulk of requests to several attesters
   *
   * @param attesters
   * @param messageBody
   */
  private bulkSend(
    attesters: Contact[],
    messageBody: MessageBody
  ): Promise<void> {
    const failedReceivers: Contact[] = []

    if (!attesters || !attesters.length) {
      notifyFailure('No attesters selected')
      return Promise.reject()
    }

    return new Promise((resolve, reject) => {
      Promise.all(
        attesters.map((attester: Contact) => {
          return MessageRepository.send(attester, messageBody)
        })
      )
        .then(() => {
          notifySuccess(
            `'${messageBody.type}' message${
              attesters.length > 1 ? 's' : ''
            } successfully sent.`
          )
          resolve()
        })
        .catch(error => {
          errorService.log({
            error,
            message: `Failed to send '${messageBody.type}' message${
              failedReceivers.length > 1 ? 's' : ''
            } to '${failedReceivers
              .map((receiver: Contact) => receiver.metaData.name)
              .join(',')}'`,
            origin: 'AttestationsWorkflow.bulkSend()',
            type: 'ERROR.FETCH.POST',
          })
          reject(failedReceivers)
        })
    })
  }
}

export default new AttestationWorkflow()
