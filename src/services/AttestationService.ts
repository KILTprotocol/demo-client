import * as sdk from '@kiltprotocol/prototype-sdk'
import moment from 'moment'

import * as Attestations from '../state/ducks/Attestations'
import * as Claims from '../state/ducks/Claims'
import * as Wallet from '../state/ducks/Wallet'
import persistentStore from '../state/PersistentStore'
import BlockchainService from './BlockchainService'
import errorService from './ErrorService'
import { notifySuccess } from './FeedbackService'

class AttestationService {
  /**
   * Creates and stores an attestation for the given `claim` on the blockchain.
   *
   * @param requestForAttestation the request for attestation
   * @returns the attestated claim (including the on-chain stored attestation)
   *   in a promise
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
        .store(blockchain, selectedIdentity)
        .then(() => {
          resolve(attestedClaim)
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
  ): Promise<void> {
    const attestation = sdk.Attestation.fromObject(iAttestation)
    const {
      selectedIdentity,
      blockchain,
    } = await this.getBlockchainAndIdentity()

    if (!selectedIdentity) {
      return Promise.reject('No identity selected')
    }

    return new Promise<void>(async (resolve, reject) => {
      attestation
        .revoke(blockchain, selectedIdentity)
        .then(() => {
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
    return sdk.AttestedClaim.fromObject(attestedClaim)
      .verify(blockchain)
      .then((verified: boolean) => {
        attestedClaim.attestation.revoked = !verified
        persistentStore.store.dispatch(
          Claims.Store.updateAttestation(attestedClaim)
        )
        return verified
      })
  }

  public saveInStore(attestationEntry: Attestations.Entry): void {
    attestationEntry.created = Date.now()
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
    const selectedIdentity: sdk.Identity = Wallet.getSelectedIdentity(
      persistentStore.store.getState()
    ).identity
    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    return {
      blockchain,
      selectedIdentity,
    }
  }
}

export default new AttestationService()
