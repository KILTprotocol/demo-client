import {
  Attestation,
  AttestedClaim,
  DelegationNodeUtils,
  Identity,
  SDKErrors,
} from '@kiltprotocol/sdk-js'
import { BlockchainUtils } from '@kiltprotocol/chain-helpers'
import {
  IAttestation,
  IAttestedClaim,
  IRequestForAttestation,
} from '@kiltprotocol/types'
import { ClaimSelectionData } from '../components/SelectAttestedClaims/SelectAttestedClaims'

import * as Attestations from '../state/ducks/Attestations'
import * as Claims from '../state/ducks/Claims'
import * as Wallet from '../state/ducks/Wallet'
import { persistentStoreInstance } from '../state/PersistentStore'
import ErrorService from './ErrorService'
import { notifySuccess, notifyError } from './FeedbackService'

const { IS_IN_BLOCK } = BlockchainUtils

class AttestationService {
  /**
   * Creates and stores an attestation for the given `claim` on the blockchain.
   *
   * @param requestForAttestation the request for attestation
   * @returns the attestated claim (including the on-chain stored attestation)
   *   in a promise
   */
  public static async attestClaim(
    requestForAttestation: IRequestForAttestation
  ): Promise<AttestedClaim> {
    const selectedIdentity = AttestationService.getIdentity()

    if (!selectedIdentity) {
      throw new Error('No identity selected')
    }

    const attestation = Attestation.fromRequestAndPublicIdentity(
      requestForAttestation,
      selectedIdentity.getPublicIdentity()
    )

    const attestedClaim = AttestedClaim.fromRequestAndAttestation(
      requestForAttestation,
      attestation
    )
    if (!attestedClaim.verifyData()) {
      throw new Error('Verification failed')
    }

    try {
      const tx = await attestation.store(selectedIdentity)
      await BlockchainUtils.submitSignedTx(tx, {
        resolveOn: IS_IN_BLOCK,
      })
    } catch (error) {
      ErrorService.log({
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
    iAttestation: IAttestation
  ): Promise<void> {
    const attestation = Attestation.fromAttestation(iAttestation)
    const selectedIdentity = AttestationService.getIdentity()

    const delegationTreeTraversalSteps = await DelegationNodeUtils.countNodeDepth(
      selectedIdentity,
      attestation
    )

    if (!selectedIdentity) {
      throw new Error('No identity selected')
    }
    try {
      const tx = await attestation.revoke(
        selectedIdentity,
        delegationTreeTraversalSteps
      )

      await BlockchainUtils.submitSignedTx(tx, { resolveOn: IS_IN_BLOCK })
      notifySuccess('Attestation successfully revoked')
      persistentStoreInstance.store.dispatch(
        Attestations.Store.revokeAttestation(attestation.claimHash)
      )
    } catch (error) {
      ErrorService.log({
        error,
        message: 'Could not revoke Attestation',
        origin: 'AttestationService.revokeAttestation()',
        type: 'ERROR.BLOCKCHAIN',
      })
      throw error
    }
  }

  public static async revokeByClaimHash(
    claimHash: IAttestation['claimHash']
  ): Promise<void> {
    const selectedIdentity = AttestationService.getIdentity()
    const attestation = await Attestation.query(claimHash)

    if (attestation === null) {
      throw SDKErrors.ERROR_NOT_FOUND('Attestation not on chain')
    }
    const delegationTreeTraversalSteps = await DelegationNodeUtils.countNodeDepth(
      selectedIdentity,
      attestation
    )

    try {
      const tx = await attestation.revoke(
        selectedIdentity,
        delegationTreeTraversalSteps
      )

      await BlockchainUtils.submitSignedTx(tx, {
        resolveOn: IS_IN_BLOCK,
      })

      notifySuccess(`Attestation successfully revoked.`)
      persistentStoreInstance.store.dispatch(
        Attestations.Store.revokeAttestation(claimHash)
      )
    } catch (error) {
      ErrorService.log({
        error,
        message: 'Could not revoke Attestation',
        origin: 'AttestationService.revokeAttestation()',
        type: 'ERROR.BLOCKCHAIN',
      })
      notifyError(error)
    }
  }

  public static async verifyAttestatedClaim(
    attestedClaim: IAttestedClaim
  ): Promise<boolean> {
    const initialisedAttestedClaim = AttestedClaim.fromAttestedClaim(
      attestedClaim
    )
    return initialisedAttestedClaim.verify()
  }

  public static verifyAttestation(attestation: IAttestation): Promise<boolean> {
    const initialisedAttestation = Attestation.fromAttestation(attestation)
    return initialisedAttestation.checkValidity()
  }

  public static saveInStore(attestationEntry: Attestations.Entry): void {
    const newEntry = attestationEntry
    newEntry.created = Date.now()
    persistentStoreInstance.store.dispatch(
      Attestations.Store.saveAttestation(attestationEntry)
    )
  }

  public static removeFromStore(claimHash: IAttestation['claimHash']): void {
    persistentStoreInstance.store.dispatch(
      Attestations.Store.removeAttestation(claimHash)
    )
  }

  public static getExcludedProperties(
    claimEntry: Claims.Entry,
    selectedClaimProperties: string[]
  ): string[] {
    const propertyNames: string[] = Object.keys(claimEntry.claim.contents)
    const excludedProperties = propertyNames.filter(
      (propertyName: string) => !selectedClaimProperties.includes(propertyName)
    )
    return excludedProperties
  }

  public static getAttestedClaims(
    claimSelectionData: ClaimSelectionData
  ): IAttestedClaim[] {
    const selectedClaimEntryIds = Object.keys(claimSelectionData)

    const attestedClaims: IAttestedClaim[] = []

    selectedClaimEntryIds.forEach(
      (selectedClaimEntryId: Claims.Entry['id']) => {
        const { claimEntry, state } = claimSelectionData[selectedClaimEntryId]

        state.selectedAttestedClaims.forEach(
          (selectedAttestedClaim: IAttestedClaim) => {
            const attClaim = AttestedClaim.fromAttestedClaim(
              selectedAttestedClaim
            )

            attClaim.request.removeClaimProperties(
              AttestationService.getExcludedProperties(
                claimEntry,
                state.selectedClaimProperties
              )
            )
            attestedClaims.push(attClaim)
          }
        )
      }
    )
    return attestedClaims
  }

  private static getIdentity(): Identity {
    const selectedIdentity = Wallet.getSelectedIdentity(
      persistentStoreInstance.store.getState()
    )?.identity

    if (!selectedIdentity) {
      throw new Error('No selected Identity')
    }

    return selectedIdentity
  }
}

export default AttestationService
