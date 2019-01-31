import * as sdk from '@kiltprotocol/prototype-sdk'
import moment from 'moment'

import * as Attestations from '../state/ducks/Attestations'
import persistentStore from '../state/PersistentStore'
import BlockchainService from './BlockchainService'
import errorService from './ErrorService'
import { notifySuccess } from './FeedbackService'

class AttestationService {
  /**
   * Creates and stores an attestation for the given `claim` on the blockchain.
   *
   * @param claim the claim to attest
   * @returns the stored attestation in a promise
   */
  public async attestClaim(claim: sdk.IClaim): Promise<sdk.Attestation> {
    const {
      selectedIdentity,
      blockchain,
    } = await this.getBlockchainAndIdentity()

    if (!selectedIdentity) {
      return Promise.reject('No identity selected')
    }

    const attestation: sdk.Attestation = new sdk.Attestation(
      claim,
      selectedIdentity
    )

    return new Promise<sdk.Attestation>(async (resolve, reject) => {
      attestation
        .store(blockchain, selectedIdentity, () => {
          resolve(attestation)
        })
        .then((hash: any) => {
          // ignore
        })
        .catch(error => {
          errorService.log({
            error,
            message: 'Error storing attestation on blockchain',
            origin: 'AttestationService.attestClaim()',
            type: 'ERROR.BLOCKCHAIN',
          })
          reject(error)
        })
    })
  }

  public async revokeAttestation(
    iAttestation: sdk.IAttestation
  ): Promise<sdk.Attestation> {
    const attestation = sdk.Attestation.fromObject(iAttestation)
    const {
      selectedIdentity,
      blockchain,
    } = await this.getBlockchainAndIdentity()

    if (!selectedIdentity) {
      return Promise.reject('No identity selected')
    }

    return new Promise<sdk.Attestation>(async (resolve, reject) => {
      attestation
        .revoke(blockchain, selectedIdentity, () => {
          notifySuccess('Attestation successfully revoked')
          persistentStore.store.dispatch(
            Attestations.Store.revokeAttestation(attestation.claimHash)
          )
          resolve()
        })
        .catch(error => {
          errorService.log({
            error,
            message: 'Could not revoke Attestation',
            origin: 'AttestationService.attestClaim()',
            type: 'ERROR.BLOCKCHAIN',
          })
          reject(error)
        })
    })
  }

  public async verifyAttestation(
    iAttestation: sdk.Attestation
  ): Promise<boolean> {
    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    const attestation: sdk.Attestation = sdk.Attestation.fromObject(
      iAttestation
    )
    return attestation.verify(blockchain)
  }

  public saveInStore(attestationEntry: Attestations.Entry): void {
    const m: moment.Moment = moment()
    attestationEntry.created = m // 'YYYY-MM-DD HH:mm'
    persistentStore.store.dispatch(
      Attestations.Store.saveAttestation(attestationEntry)
    )
  }

  public removeFromStore(claimHash: sdk.IAttestation['claimHash']): void {
    persistentStore.store.dispatch(
      Attestations.Store.removeAttestation(claimHash)
    )
  }

  private async getBlockchainAndIdentity(): Promise<{
    blockchain: sdk.Blockchain
    selectedIdentity: sdk.Identity
  }> {
    const selectedIdentity: sdk.Identity = persistentStore.getSelectedIdentity()
    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    return {
      blockchain,
      selectedIdentity,
    }
  }
}

export default new AttestationService()
