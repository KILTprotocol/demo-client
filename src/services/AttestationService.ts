import Kilt, {
  IRequestForAttestation,
  AttestedClaim,
  IAttestation,
  IAttestedClaim,
  Identity,
} from '@kiltprotocol/sdk-js'
import { ClaimSelectionData } from '../components/SelectAttestedClaims/SelectAttestedClaims'

import * as Attestations from '../state/ducks/Attestations'
import * as Claims from '../state/ducks/Claims'
import * as Wallet from '../state/ducks/Wallet'
import persistentStore from '../state/PersistentStore'
import ErrorService from './ErrorService'
import { notifySuccess, notifyError } from './FeedbackService'

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

    const attestation = Kilt.Attestation.fromRequestAndPublicIdentity(
      requestForAttestation,
      selectedIdentity.getPublicIdentity()
    )

    const attestedClaim = Kilt.AttestedClaim.fromRequestAndAttestation(
      requestForAttestation,
      attestation
    )
    if (!attestedClaim.verifyData()) {
      throw new Error('Verification failed')
    }

    try {
      await attestation.store(selectedIdentity)
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
    const attestation = Kilt.Attestation.fromAttestation(iAttestation)
    const selectedIdentity = AttestationService.getIdentity()

    if (!selectedIdentity) {
      throw new Error('No identity selected')
    }
    try {
      await attestation.revoke(selectedIdentity)
      notifySuccess('Attestation successfully revoked')
      persistentStore.store.dispatch(
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

  public static revokeByClaimHash(
    claimHash: IAttestation['claimHash']
  ): Promise<void> {
    const selectedIdentity = AttestationService.getIdentity()

    return Kilt.Attestation.revoke(claimHash, selectedIdentity)
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
    attestedClaim: IAttestedClaim
  ): Promise<boolean> {
    const initialisedAttestedClaim = Kilt.AttestedClaim.fromAttestedClaim(
      attestedClaim
    )
    return initialisedAttestedClaim.verify()
  }

  public static verifyAttestation(attestation: IAttestation): Promise<boolean> {
    const initialisedAttestation = Kilt.Attestation.fromAttestation(attestation)
    return initialisedAttestation.checkValidity()
  }

  public static saveInStore(attestationEntry: Attestations.Entry): void {
    const newEntry = attestationEntry
    newEntry.created = Date.now()
    persistentStore.store.dispatch(
      Attestations.Store.saveAttestation(attestationEntry)
    )
  }

  public static removeFromStore(claimHash: IAttestation['claimHash']): void {
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
            const attClaim = Kilt.AttestedClaim.fromAttestedClaim(
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
      persistentStore.store.getState()
    ).identity
    return selectedIdentity
  }
}

export default AttestationService
