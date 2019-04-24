import * as sdk from '@kiltprotocol/prototype-sdk'
import moment from 'moment'
import { ClaimSelectionData } from '../components/SelectAttestedClaims/SelectAttestedClaims'

import * as Attestations from '../state/ducks/Attestations'
import * as Claims from '../state/ducks/Claims'
import * as Wallet from '../state/ducks/Wallet'
import persistentStore from '../state/PersistentStore'
import BlockchainService from './BlockchainService'
import ErrorService from './ErrorService'
import errorService from './ErrorService'
import { notifySuccess, notifyFailure, notifyError } from './FeedbackService'

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
      throw new Error('No identity selected')
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
      throw new Error('Verification failed')
    }

    try {
      await attestation.store(blockchain, selectedIdentity)
    } catch (error) {
      errorService.log({
        error,
        message: 'Error storing attestation on blockchain',
        origin: 'AttestationService.attestClaim()',
        type: 'ERROR.BLOCKCHAIN',
      })
      throw error
    }
    return attestedClaim
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
      throw new Error('No identity selected')
    }
    try {
      await attestation.revoke(blockchain, selectedIdentity)
      notifySuccess('Attestation successfully revoked')
      persistentStore.store.dispatch(
        Attestations.Store.revokeAttestation(attestation.claimHash)
      )
    } catch (error) {
      errorService.log({
        error,
        message: 'Could not revoke Attestation',
        origin: 'AttestationService.revokeAttestation()',
        type: 'ERROR.BLOCKCHAIN',
      })
      throw error
    }
  }

  public static async revokeByClaimHash(
    claimHash: sdk.IAttestation['claimHash']
  ) {
    const {
      selectedIdentity,
      blockchain,
    } = await AttestationService.getBlockchainAndIdentity()

    return sdk.Attestation.revoke(blockchain, claimHash, selectedIdentity)
      .then(() => {
        notifySuccess(`Attestation successfully revoked.`)
        persistentStore.store.dispatch(
          Attestations.Store.revokeAttestation(claimHash)
        )
      })
      .catch(error => {
        ErrorService.log({
          error,
          message: `Could not revoke attestation.`,
          origin: 'AttestationService.revokeByClaimHash()',
          type: 'ERROR.BLOCKCHAIN',
        })
        notifyError(error)
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
