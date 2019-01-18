import * as sdk from '@kiltprotocol/prototype-sdk'
import persistentStore from 'src/state/PersistentStore'
import { Contact } from 'src/types/Contact'
import {
  ApproveAttestationForClaim,
  Message,
  MessageBodyType,
} from 'src/types/Message'
import BlockchainService from './BlockchainService'
import ErrorService from './ErrorService'
import MessageRepository from './MessageRepository'

class AttestationService {
  /**
   * Verifies the given `claim`, stores it on chain and sends a message to the
   * claimer.
   *
   * @param claim the claim to attest
   * @param claimer the person that wants to attest the claim
   */
  public async attestClaim(claim: sdk.IClaim, claimer: Contact): Promise<void> {
    const selectedIdentity: sdk.Identity = persistentStore.getSelectedIdentity()

    if (!selectedIdentity) {
      return Promise.reject()
    }

    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    const attestation: sdk.Attestation = new sdk.Attestation(
      claim,
      selectedIdentity
    )

    console.log('initialize')

    return new Promise<void>(async (resolve, reject) => {
      attestation
        .store(blockchain, selectedIdentity, () => {
          console.log('attestation stored on chain')

          this.sendAttestationApprovedMessage(attestation, claimer, claim)
            .then((message: any) => {
              resolve()
            })
            .catch(error => {
              // TODO error handling
              ErrorService.log('attestation.create', error)
              reject(error)
            })
        })
        .then((hash: any) => {
          console.log('submitted with hash ' + hash)
        })
        .catch(error => {
          // TODO error handling
          ErrorService.log('attestation.create', error)
          reject()
        })
    })
  }

  private async sendAttestationApprovedMessage(
    attestation: sdk.IAttestation,
    claimer: Contact,
    claim: sdk.IClaim
  ): Promise<Message> {
    const attestationMessageBody: ApproveAttestationForClaim = {
      content: {
        claim,
        attestation,
      },
      type: MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM,
    }
    return MessageRepository.send(claimer, attestationMessageBody)
  }
}

export default new AttestationService()
