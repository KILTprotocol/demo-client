import * as sdk from '@kiltprotocol/prototype-sdk'

import AttestationService from '../../services/AttestationService'
import ContactRepository from '../../services/ContactRepository'
import MessageRepository from '../../services/MessageRepository'
import * as Claims from '../../state/ducks/Claims'
import * as Attestations from '../../state/ducks/Attestations'
import { MyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'
import { ICType } from '../../types/Ctype'
import { BsClaim, BsClaimsPool, BsClaimsPoolElement } from './DevTools.claims'
import { BsCType } from './DevTools.ctypes'
import { BsDelegation, BsDelegationsPool } from './DevTools.delegations'
import { BsIdentitiesPool, BsIdentity } from './DevTools.wallet'

import attestationsPool from './data/attestations.json'

type UpdateCallback = (bsAttestationKey: keyof BsAttestationsPool) => void

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
    withMessages: boolean,
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

    const requestForAttestation: sdk.RequestForAttestation = await BsAttestation.getRequestForAttestation(
      bsAttestationData,
      claimToAttest,
      bsAttestedClaims,
      claimerIdentity
    )

    const attestedClaim: sdk.AttestedClaim = await BsAttestation.attesterAttestsClaim(
      bsAttestationData,
      bsAttestationKey,
      bsAttestedClaims,
      claimerIdentity,
      requestForAttestation
    )

    // import to claimers claim
    // therefore switch to claimer identity
    await BsIdentity.selectIdentity(claimerIdentity)
    PersistentStore.store.dispatch(Claims.Store.addAttestation(attestedClaim))

    if (withMessages) {
      BsAttestation.sendMessages(
        bsAttestationData,
        claimerIdentity,
        bsClaim,
        requestForAttestation,
        attestedClaim
      )
    }

    // create dependent attestations
    if (then) {
      await BsAttestation.createAttestations(
        then,
        bsAttestedClaims,
        withMessages,
        updateCallback
      )
    }
  }

  public static async createAttestations(
    pool: BsAttestationsPool,
    bsAttestedClaims: BsAttestedClaims,
    withMessages: boolean,
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
            withMessages,
            updateCallback
          )
        })
      },
      Promise.resolve()
    )
    return requests
  }

  public static async create(
    withMessages: boolean,
    updateCallback?: UpdateCallback
  ): Promise<void> {
    return BsAttestation.createAttestations(
      BsAttestation.pool,
      {},
      withMessages,
      updateCallback
    )
  }

  private static async getRequestForAttestation(
    bsAttestationData: BsAttestationsPoolElement,
    claimToAttest: Claims.Entry,
    bsAttestedClaims: BsAttestedClaims,
    claimerIdentity: MyIdentity
  ): Promise<sdk.RequestForAttestation> {
    const { attest } = bsAttestationData
    const { delegationKey, legitimations } = attest

    // resolve delegation
    let delegation: MyDelegation | undefined
    if (delegationKey) {
      delegation = await BsDelegation.getDelegationByKey(delegationKey)
    }

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

    return new sdk.RequestForAttestation(
      claimToAttest.claim,
      _legitimations,
      claimerIdentity.identity,
      delegation ? delegation.id : undefined
    )
  }

  /**
   * collection of attesters actions necessary for attesting
   *
   * @param bsAttestationData
   * @param bsAttestationKey
   * @param bsAttestedClaims
   * @param claimerIdentity
   * @param requestForAttestation
   */
  private static async attesterAttestsClaim(
    bsAttestationData: BsAttestationsPoolElement,
    bsAttestationKey: keyof BsAttestationsPool,
    bsAttestedClaims: BsAttestedClaims,
    claimerIdentity: MyIdentity,
    requestForAttestation: sdk.RequestForAttestation
  ): Promise<sdk.AttestedClaim> {
    const { attest } = bsAttestationData
    const { attesterKey } = attest

    const attesterIdentity: MyIdentity = await BsIdentity.getByKey(attesterKey)

    // for the following actions we need to take the role of the attester
    await BsIdentity.selectIdentity(attesterIdentity)

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

  private static async sendMessages(
    bsAttestationData: BsAttestationsPoolElement,
    claimerIdentity: MyIdentity,
    bsClaim: BsClaimsPoolElement,
    requestForAttestation: sdk.RequestForAttestation,
    attestedClaim: sdk.AttestedClaim
  ): Promise<void> {
    const { attest } = bsAttestationData
    const { attesterKey } = attest

    const attesterIdentity: MyIdentity = await BsIdentity.getByKey(attesterKey)
    const cType: ICType = await BsCType.getByKey(bsClaim.cTypeKey)

    const partialClaim = {
      cType: cType.cType.hash as string,
      contents: bsClaim.data,
      owner: claimerIdentity.identity.address,
    }

    // send request for legitimation from claimer to attester
    const requestAcceptDelegation: sdk.IRequestLegitimations = {
      content: partialClaim,
      type: sdk.MessageBodyType.REQUEST_LEGITIMATIONS,
    }
    await MessageRepository.singleSend(
      requestAcceptDelegation,
      claimerIdentity,
      ContactRepository.getContactFromIdentity(attesterIdentity)
    )

    // send legitimations from attester to claimer
    const submitLegitimations: sdk.ISubmitLegitimations = {
      content: {
        claim: partialClaim,
        delegationId: attestedClaim.request.delegationId,
        legitimations: attestedClaim.request.legitimations,
      },
      type: sdk.MessageBodyType.SUBMIT_LEGITIMATIONS,
    }
    await MessageRepository.singleSend(
      submitLegitimations,
      attesterIdentity,
      ContactRepository.getContactFromIdentity(claimerIdentity)
    )

    // send signed legitmations from claimer to attester
    const requestAttestationForClaim: sdk.IRequestAttestationForClaim = {
      content: requestForAttestation,
      type: sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
    }
    await MessageRepository.singleSend(
      requestAttestationForClaim,
      claimerIdentity,
      ContactRepository.getContactFromIdentity(attesterIdentity)
    )

    // send attested claim from attester to claimer
    const submitAttestationForClaim: sdk.ISubmitAttestationForClaim = {
      content: attestedClaim,
      type: sdk.MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
    }
    await MessageRepository.singleSend(
      submitAttestationForClaim,
      attesterIdentity,
      ContactRepository.getContactFromIdentity(claimerIdentity)
    )
  }
}

export { BsAttestation, BsAttestationsPool }
