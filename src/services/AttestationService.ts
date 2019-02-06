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
   * @param requestForAttestation the request for attestation
   * @returns the attestated claim (including the on-chain stored attestation) in a promise
   */
  public async attestClaim(
    requestForAttestation: sdk.IRequestForAttestation
  ): Promise<sdk.AttestedClaim> {
    const {
      selectedIdentity,
      blockchain,
    } = await this.getBlockchainAndIdentity()

    if (!selectedIdentity) {
      return Promise.reject('No identity selected')
    }

    const attestation: sdk.Attestation = new sdk.Attestation(
      requestForAttestation,
      selectedIdentity
    )

    const attestedClaim: sdk.AttestedClaim = new sdk.AttestedClaim(
      requestForAttestation,
      attestation
    )
    if (!attestedClaim.verifyData()) {
      return Promise.reject(new Error('verification failed'))
    }

    return new Promise<sdk.AttestedClaim>(async (resolve, reject) => {
      attestation
        .store(blockchain, selectedIdentity, () => {
          resolve(attestedClaim)
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

  public async verifyAttestatedClaim(
    attestedClaim: sdk.IAttestedClaim
  ): Promise<boolean> {
    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    return sdk.AttestedClaim.fromObject(attestedClaim).verify(blockchain)
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
