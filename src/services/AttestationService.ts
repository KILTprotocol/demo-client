import * as sdk from '@kiltprotocol/prototype-sdk'

import { Contact } from 'src/types/Contact'
import persistentStore from 'src/state/PersistentStore'
import { ApproveAttestationForClaim, MessageBodyType } from 'src/types/Message'
import MessageRepository from './MessageRepository'

class AttestationService {
  /**
   * Verifies the given `claim`, stores it on chain and sends a message to the claimer.
   *
   * @param claim the claim to attest
   * @param claimer the person that wants to attest the claim
   */
  public async attestClaim(claim: sdk.IClaim, claimer: Contact): Promise<void> {
    const selectedIdentity: sdk.Identity = persistentStore.getSelectedIdentity()

    if (!selectedIdentity) {
      return Promise.reject()
    }

    return new Promise<void>(async (resolve, reject) => {
      console.log('selectedIdentity', selectedIdentity)

      const attestationMessageBody: ApproveAttestationForClaim = {
        content: {
          claimHash: claim.hash,
          owner: selectedIdentity.signPublicKeyAsHex,
          revoked: false,
          signature: claim.hash + selectedIdentity.signPublicKeyAsHex,
        },
        type: MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM,
      }
      try {
        await MessageRepository.send(claimer, attestationMessageBody)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }
}

export default new AttestationService()
