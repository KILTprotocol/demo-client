import * as sdk from '@kiltprotocol/prototype-sdk'

import attestationService from '../services/AttestationService'
import * as Attestations from '../state/ducks/Attestations'
import persistentStore from '../state/PersistentStore'
import { Contact } from '../types/Contact'
import {
  ApproveAttestationForClaim,
  MessageBodyType,
  RequestAttestationForClaim,
  RequestLegitimationsForClaimAttestation,
} from '../types/Message'
import errorService from './ErrorService'
import { notifySuccess } from './FeedbackService'
import MessageRepository from './MessageRepository'

class AttestationWorkflow {
  /**
   * Sends a legitimations request for attestating a claim to attesters.
   *
   * @param claim the claim to be attested
   * @param attesters the attesters to send the legitimations request to
   */
  public requestLegitimationsForClaimAttestation(
    claim: sdk.IClaim,
    attesters: Contact[]
  ): Promise<RequestLegitimationsForClaimAttestation> {
    throw new Error('not implemented')
  }

  /**
   * Sends back the legitimations along with the claim to the claimer.
   *
   * @param claim the claim to attest
   * @param legitimations the list of legitimations to be included in the attestation
   * @param claimer the claimer who requested the legitimations
   */
  public submitLegitimationsForClaimAttestation(
    claim: sdk.IClaim,
    legitimations: sdk.IAttestedClaim[],
    claimer: Contact
  ): Promise<void> {
    throw new Error('not implemented')
  }

  /**
   * Creates the request for claim attestation and sends it to the attester.
   *
   * @param claim the claim to attest
   * @param attesters the attesters to send the request to
   */
  public requestAttestationForClaim(
    claim: sdk.IClaim,
    attesters: Contact[]
  ): Promise<void> {
    const identity: sdk.Identity = persistentStore.getSelectedIdentity()
    const requestForAttestation: sdk.IRequestForAttestation = new sdk.RequestForAttestation(
      claim,
      [],
      identity
    )

    return new Promise((resolve, reject) => {
      Promise.all(
        attesters.map((attester: Contact) => {
          const messageBody = {
            content: requestForAttestation,
            type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
          } as RequestAttestationForClaim
          return MessageRepository.send(attester, messageBody)
        })
      )
        .then(() => {
          notifySuccess('Attestation reqest sent.')
          resolve()
        })
        .catch(error => {
          errorService.log({
            error,
            message: `Could not send message ${
              MessageBodyType.REQUEST_LEGITIMATIONS_FOR_CLAIM_ATTESTATION
            }`,
            origin: 'AttestationsWorkflow.requestAttestationForClaim()',
            type: 'ERROR.FETCH.GET',
          })
          reject(error)
        })
    })
  }

  /**
   * Verifies the given request for attestation, creates an attestation on chain and sends it to the claimer.
   *
   * @param requestForAttestation the request for attestation to be verified and attested
   */
  public approveAndSubmitAttestationForClaim(
    requestForAttestation: sdk.IRequestForAttestation,
    claimer: Contact
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      attestationService
        .attestClaim(requestForAttestation)
        .then((attestedClaim: sdk.IAttestedClaim) => {
          // store attestation locally
          attestationService.saveInStore({
            attestation: attestedClaim.attestation,
            claimerAddress: attestedClaim.request.claim.owner,
            claimerAlias: claimer.metaData.name,
            ctypeHash: attestedClaim.request.claim.ctype,
            ctypeName: '<tbd>',
          } as Attestations.Entry)

          // build 'claim attested' message and send to claimer
          const attestationMessageBody: ApproveAttestationForClaim = {
            content: attestedClaim,
            type: MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM,
          }
          MessageRepository.send(claimer, attestationMessageBody)
            .then(message => {
              resolve()
            })
            .catch(error => {
              errorService.log({
                error,
                message: 'Could send attested claim to claimer',
                origin:
                  'AttestationWorkflow.approveAndSubmitAttestationForClaim()',
              })
              reject(error)
            })
        })
        .catch(error => {
          errorService.log({
            error,
            message: 'Could not create attestation for claim',
            origin: 'AttestationWorkflow.approveAndSubmitAttestationForClaim()',
          })
          reject(error)
        })
    })
  }

  /**
   * Import the attested claim to local storage.
   *
   * @param attestedClaim the attested claim to import
   */
  public importAttestedClaim(attestedClaim: sdk.IAttestedClaim): Promise<void> {
    throw new Error('not implemented')
  }
}

export default new AttestationWorkflow()
