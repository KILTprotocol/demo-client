import * as sdk from '@kiltprotocol/prototype-sdk'

import AttestationService from '../../services/AttestationService'
import * as Claims from '../../state/ducks/Claims'
import * as Attestations from '../../state/ducks/Attestations'
import { MyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'
import { BsClaim, BsClaimsPool, BsClaimsPoolElement } from './DevTools.claims'
import { BsDelegation, BsDelegationsPool } from './DevTools.delegations'
import { BsIdentitiesPool, BsIdentity } from './DevTools.wallet'

import attestationsPool from './data/attestations.json'

type UpdateCallback = (attestationKey: keyof BsAttestationsPool) => void

type BsAttestationsPoolElement = {
  attest: {
    attesterKey: keyof BsIdentitiesPool
    legitimations?: Array<keyof BsAttestationsPool>
    delegationKey?: keyof BsDelegationsPool
  }
  claimKey: keyof BsClaimsPool
  then?: BsAttestationsPool
}

type BsAttestationsPool = {
  [attestationKey: string]: BsAttestationsPoolElement
}

type BsAttestedClaims = {
  [attestationKey: string]: sdk.AttestedClaim
}

class BsAttestation {
  public static pool: BsAttestationsPool = attestationsPool as BsAttestationsPool

  public static async createAttestation(
    bsAttestationData: BsAttestationsPoolElement,
    bsAttestationKey: keyof BsAttestationsPool,
    bsAttestedClaims: BsAttestedClaims,
    updateCallback?: UpdateCallback
  ): Promise<void> {
    const { attest, claimKey, then } = bsAttestationData
    const { attesterKey } = attest

    if (!claimKey || !attest || !attesterKey) {
      throw new Error(`Invalid attestation data`)
    }

    const bsClaim: BsClaimsPoolElement = await BsClaim.getBsClaimByKey(claimKey)
    const claimerIdentity: MyIdentity = await BsIdentity.getByKey(
      bsClaim.claimerKey
    )

    if (updateCallback) {
      updateCallback(bsAttestationKey)
    }

    // get claim to attest
    // for this we take the role of the claimer
    await BsIdentity.selectIdentity(claimerIdentity)
    const claimToAttest: Claims.Entry = await BsClaim.getClaimByKey(claimKey)

    const attestedClaim = await BsAttestation.attesterAttestsClaim(
      bsAttestationData,
      bsAttestationKey,
      bsAttestedClaims,
      claimToAttest,
      claimerIdentity
    )

    // import to claimers claim
    // therefore switch to claimer identity
    await BsIdentity.selectIdentity(claimerIdentity)
    PersistentStore.store.dispatch(Claims.Store.addAttestation(attestedClaim))

    // create dependent attestations
    if (then) {
      await BsAttestation.createAttestations(
        then,
        bsAttestedClaims,
        updateCallback
      )
    }
  }

  public static async createAttestations(
    pool: BsAttestationsPool,
    bsAttestedClaims: BsAttestedClaims,
    updateCallback?: UpdateCallback
  ): Promise<void> {
    const bsAttestationKeys = Object.keys(pool)
    const requests = bsAttestationKeys.reduce(
      (promiseChain, bsAttestationKey) => {
        return promiseChain.then(() => {
          return BsAttestation.createAttestation(
            pool[bsAttestationKey],
            bsAttestationKey,
            bsAttestedClaims,
            updateCallback
          )
        })
      },
      Promise.resolve()
    )
    return requests
  }

  public static async create(updateCallback?: UpdateCallback): Promise<void> {
    return BsAttestation.createAttestations(
      BsAttestation.pool,
      {},
      updateCallback
    )
  }

  /**
   * collection of attesters actions necessary for attesting
   *
   * @param bsAttestationData
   * @param bsAttestationKey
   * @param bsAttestedClaims
   * @param claimToAttest
   * @param claimerIdentity
   */
  private static async attesterAttestsClaim(
    bsAttestationData: BsAttestationsPoolElement,
    bsAttestationKey: keyof BsAttestationsPool,
    bsAttestedClaims: BsAttestedClaims,
    claimToAttest: Claims.Entry,
    claimerIdentity: MyIdentity
  ): Promise<sdk.AttestedClaim> {
    const { attest } = bsAttestationData
    const { attesterKey, delegationKey, legitimations } = attest

    const attesterIdentity: MyIdentity = await BsIdentity.getByKey(attesterKey)

    // for the following actions we need to take the role of the attester
    await BsIdentity.selectIdentity(attesterIdentity)

    // get legitimations of attester
    let _legitimations: sdk.AttestedClaim[] = []
    if (legitimations && Array.isArray(legitimations) && legitimations.length) {
      _legitimations = await Promise.all(
        (legitimations || []).map(
          (
            _bsAttestationKey: keyof BsAttestationsPool
          ): Promise<sdk.AttestedClaim> => {
            const bsAttestedClaim = bsAttestedClaims[_bsAttestationKey]
            if (bsAttestedClaim) {
              return Promise.resolve(bsAttestedClaim)
            }
            throw new Error(
              `Could not find attestedClaim for key '${_bsAttestationKey}'`
            )
          }
        )
      )
    }

    // resolve delegation
    let delegation: MyDelegation | undefined
    if (delegationKey) {
      delegation = await BsDelegation.getDelegationByKey(delegationKey)
    }

    // create request for attestation
    const requestForAttestation: sdk.RequestForAttestation = new sdk.RequestForAttestation(
      claimToAttest.claim,
      _legitimations,
      claimerIdentity.identity,
      delegation ? delegation.id : undefined
    )

    // create attested claim and store for reference
    const attestedClaim: sdk.AttestedClaim = await AttestationService.attestClaim(
      requestForAttestation
    )
    bsAttestedClaims[bsAttestationKey] = attestedClaim

    // store attestation locally
    AttestationService.saveInStore({
      attestation: attestedClaim.attestation,
      cTypeHash: attestedClaim.request.claim.cType,
      claimerAddress: claimerIdentity.identity.address,
      claimerAlias: claimerIdentity.metaData.name,
      created: Date.now(),
    } as Attestations.Entry)

    return attestedClaim
  }
}

export { BsAttestation, BsAttestationsPool }
