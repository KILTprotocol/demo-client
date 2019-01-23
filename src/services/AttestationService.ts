import * as sdk from '@kiltprotocol/prototype-sdk'
import persistentStore from 'src/state/PersistentStore'
import BlockchainService from './BlockchainService'
import ErrorService from './ErrorService'

class AttestationService {
  /**
   * Verifies the given `claim`, stores it on chain and sends a message to the
   * claimer.
   *
   * @param claim the claim to attest
   * @param claimer the person that wants to attest the claim
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
            origin: 'AttestationService.attestClaim()',
            message: 'Error storing attestaition on blockchain',  
            type: 'ERROR.UNCLASSIFIED'
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
