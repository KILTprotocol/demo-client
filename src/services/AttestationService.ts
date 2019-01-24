import * as sdk from '@kiltprotocol/prototype-sdk'
import persistentStore from 'src/state/PersistentStore'
import BlockchainService from './BlockchainService'
import ErrorService from './ErrorService'

class AttestationService {
  /**
   * Creates and stores an attestation for the given `claim` on the blockchain.
   *
   * @param claim the claim to attest
   * @returns the stored attestation in a promise
   */
  public async attestClaim(claim: sdk.IClaim): Promise<sdk.IAttestation> {
    const selectedIdentity: sdk.Identity = persistentStore.getSelectedIdentity()

    if (!selectedIdentity) {
      return Promise.reject('No identity selected')
    }

    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    const attestation: sdk.Attestation = new sdk.Attestation(
      claim,
      selectedIdentity
    )

    return new Promise<sdk.IAttestation>(async (resolve, reject) => {
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

  public async revokeAttestation(attestation: sdk.IAttestation): Promise<void> {
    // TODO implement revokeAttestation
  }

  public async verifyAttestation(
    iAttestation: sdk.IAttestation
  ): Promise<boolean> {
    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    const attestation: sdk.Attestation = sdk.Attestation.fromObject(
      iAttestation
    )
    return attestation.verify(blockchain)
  }
}

export default new AttestationService()
