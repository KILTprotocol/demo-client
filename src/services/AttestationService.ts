import moment from 'moment'
import * as sdk from '@kiltprotocol/prototype-sdk'
import persistentStore from 'src/state/PersistentStore'
import BlockchainService from './BlockchainService'
import ErrorService from './ErrorService'
import * as Attestations from '../state/ducks/Attestations'

class AttestationService {
  /**
   * Creates and stores an attestation for the given `claim` on the blockchain.
   *
   * @param claim the claim to attest
   * @returns the stored attestation in a promise
   */
  public async attestClaim(claim: sdk.IClaim): Promise<sdk.Attestation> {
    const selectedIdentity: sdk.Identity = persistentStore.getSelectedIdentity()

    if (!selectedIdentity) {
      return Promise.reject('No identity selected')
    }

    const blockchain: sdk.Blockchain = await BlockchainService.connect()
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
          ErrorService.log({
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
    return Promise.reject('an error occurred')
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
}

export default new AttestationService()
