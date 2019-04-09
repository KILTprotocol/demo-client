import * as sdk from '@kiltprotocol/prototype-sdk'
import moment from 'moment'
import { ClaimSelectionData } from '../components/SelectAttestedClaims/SelectAttestedClaims'

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
  public static async attestClaim(
    requestForAttestation: sdk.IRequestForAttestation
  ): Promise<sdk.AttestedClaim> {
    const {
      selectedIdentity,
      blockchain,
    } = await AttestationService.getBlockchainAndIdentity()

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

  public static async revokeAttestation(
    iAttestation: sdk.IAttestation
  ): Promise<void> {
    const attestation = sdk.Attestation.fromObject(iAttestation)
    const {
      selectedIdentity,
      blockchain,
    } = await AttestationService.getBlockchainAndIdentity()

    if (!selectedIdentity) {
      return Promise.reject('No identity selected')
    }

    return new Promise<void>(async (resolve, reject) => {
      attestation
        .revoke(blockchain, selectedIdentity)
        .then((value: any) => {
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

  public static async verifyAttestatedClaim(
    attestedClaim: sdk.IAttestedClaim
  ): Promise<boolean> {
    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    const _attestedClaim = sdk.AttestedClaim.fromObject(attestedClaim)
    return _attestedClaim.verify(blockchain)
  }

  public static saveInStore(attestationEntry: Attestations.Entry): void {
    attestationEntry.created = Date.now()
    persistentStore.store.dispatch(
      Attestations.Store.saveAttestation(attestationEntry)
    )
  }

  public static removeFromStore(
    claimHash: sdk.IAttestation['claimHash']
  ): void {
    persistentStore.store.dispatch(
      Attestations.Store.removeAttestation(claimHash)
    )
  }

  public static getExcludedProperties(
    claimEntry: Claims.Entry,
    selectedClaimProperties: string[]
  ): string[] {
    const propertyNames: string[] = Object.keys(claimEntry.claim.contents)
    const excludedProperties = propertyNames.filter(
      (propertyName: string) =>
        selectedClaimProperties.indexOf(propertyName) === -1
    )
    return excludedProperties
  }

  public static getAttestedClaims(
    claimSelectionData: ClaimSelectionData
  ): sdk.IAttestedClaim[] {
    const selectedClaimEntryIds = Object.keys(claimSelectionData)
    const attestedClaims: sdk.IAttestedClaim[] = []
    selectedClaimEntryIds.forEach(
      (selectedClaimEntryId: Claims.Entry['id']) => {
        const { claimEntry, state } = claimSelectionData[selectedClaimEntryId]
        state.selectedAttestedClaims.forEach(
          (selectedAttestedClaim: sdk.IAttestedClaim) => {
            attestedClaims.push(
              sdk.AttestedClaim.fromObject(
                selectedAttestedClaim
              ).createPresentation(
                AttestationService.getExcludedProperties(
                  claimEntry,
                  state.selectedClaimProperties
                )
              )
            )
          }
        )
      }
    )
    return attestedClaims
  }

  private static async getBlockchainAndIdentity(): Promise<{
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

export default AttestationService
