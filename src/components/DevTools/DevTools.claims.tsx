import * as sdk from '@kiltprotocol/prototype-sdk'

import * as Claims from '../../state/ducks/Claims'
import PersistentStore from '../../state/PersistentStore'
import { BsCType, BsCTypesPool } from './DevTools.ctypes'
import { BsIdentitiesPool, BsIdentity } from './DevTools.wallet'

import claims from './data/claims.json'

type UpdateCallback = (bsClaimKey: keyof BsClaimsPool) => void

type BsClaimsPoolElement = {
  alias: string
  claimerKey: keyof BsIdentitiesPool
  cTypeKey: keyof BsCTypesPool
  data: object
}

type BsClaimsPool = {
  [claimKey: string]: BsClaimsPoolElement
}

class BsClaim {
  public static pool: BsClaimsPool = claims as BsClaimsPool

  public static async save(
    BS_claimData: BsClaimsPoolElement
  ): Promise<void | sdk.Claim> {
    const identity = await BsIdentity.getByKey(BS_claimData.claimerKey)
    const cType = (await BsCType.getByKey(BS_claimData.cTypeKey)).cType
    const claim = new sdk.Claim(
      sdk.CType.fromObject(cType),
      BS_claimData.data,
      identity.identity
    )

    PersistentStore.store.dispatch(
      Claims.Store.saveAction(claim, { alias: BS_claimData.alias })
    )

    return claim
  }

  public static async savePool(
    updateCallback?: UpdateCallback
  ): Promise<void | sdk.Claim> {
    const claimKeys = Object.keys(BsClaim.pool)
    const requests = claimKeys.reduce((promiseChain, bsClaimKey) => {
      return promiseChain.then(() => {
        if (updateCallback) {
          updateCallback(bsClaimKey)
        }
        return BsClaim.save(BsClaim.pool[bsClaimKey])
      })
    }, Promise.resolve())
    return requests
  }

  public static async getBsClaimByKey(
    bsClaimKey: keyof BsClaimsPool
  ): Promise<BsClaimsPoolElement> {
    const bsClaim = BsClaim.pool[bsClaimKey]
    if (bsClaim) {
      return Promise.resolve(bsClaim)
    }
    throw new Error(`No claim for claimKey '${bsClaimKey}' found.`)
  }

  public static async getClaimByKey(
    bsClaimKey: keyof BsClaimsPool
  ): Promise<Claims.Entry> {
    const bsClaim = await BsClaim.getBsClaimByKey(bsClaimKey)
    await BsIdentity.selectIdentity(
      await BsIdentity.getByKey(bsClaim.claimerKey)
    )
    const myClaims: Claims.Entry[] = Claims.getClaims(
      PersistentStore.store.getState()
    )
    const myClaim: Claims.Entry | undefined = myClaims.find(
      (claim: Claims.Entry) => claim.meta.alias === bsClaim.alias
    )
    if (myClaim) {
      return Promise.resolve(myClaim)
    }
    throw new Error(`No claim for claimKey '${bsClaimKey}' found.`)
  }
}

export { BsClaim, BsClaimsPool, BsClaimsPoolElement }
