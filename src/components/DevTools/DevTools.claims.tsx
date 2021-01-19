import { Claim, CType, IClaim } from '@kiltprotocol/sdk-js'

import * as Claims from '../../state/ducks/Claims'
import { persistentStoreInstance } from '../../state/PersistentStore'
import { BsCType, BsCTypesPool } from './DevTools.ctypes'
import { BsIdentitiesPool, BsIdentity } from './DevTools.wallet'

import claims from './data/claims.json'

type UpdateCallback = (bsClaimKey: keyof BsClaimsPool) => void

export type BsClaimsPoolElement = {
  alias: string
  claimerKey: keyof BsIdentitiesPool
  cTypeKey: keyof BsCTypesPool
  data: IClaim['contents']
}

export type BsClaimsPool = {
  [claimKey: string]: BsClaimsPoolElement
}

class BsClaim {
  public static pool: BsClaimsPool = claims as BsClaimsPool

  public static async save(
    bsClaimData: BsClaimsPoolElement
  ): Promise<void | Claim> {
    const identity = await BsIdentity.getByKey(bsClaimData.claimerKey)
    const { cType } = await BsCType.getByKey(bsClaimData.cTypeKey)
    const claim = Claim.fromCTypeAndClaimContents(
      CType.fromCType(cType),
      bsClaimData.data,
      identity.identity.address
    )

    persistentStoreInstance.store.dispatch(
      Claims.Store.saveAction(claim, { alias: bsClaimData.alias })
    )

    return claim
  }

  public static async savePool(
    updateCallback?: UpdateCallback
  ): Promise<void | Claim> {
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
    BsIdentity.selectIdentity(await BsIdentity.getByKey(bsClaim.claimerKey))
    const myClaims: Claims.Entry[] = Claims.getClaims(
      persistentStoreInstance.store.getState()
    )
    const myClaim: Claims.Entry | undefined = myClaims.find(
      (claim: Claims.Entry) => claim.meta.alias === bsClaim.alias
    )
    if (myClaim) {
      return myClaim
    }
    throw new Error(`No claim for claimKey '${bsClaimKey}' found.`)
  }
}

export { BsClaim }
