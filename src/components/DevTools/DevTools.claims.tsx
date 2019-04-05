import * as sdk from '@kiltprotocol/prototype-sdk'

import * as Claims from '../../state/ducks/Claims'
import PersistentStore from '../../state/PersistentStore'
import { BsCType, BsCTypesPool } from './DevTools.ctypes'
import { BsIdentitiesPool, BsIdentity } from './DevTools.wallet'

import claims from './data/claims.json'

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
    updateCallback?: (claimAlias: string) => void
  ): Promise<void | sdk.Claim> {
    const claimKeys = Object.keys(BsClaim.pool)
    const requests = claimKeys.reduce((promiseChain, claimKey) => {
      return promiseChain.then(() => {
        if (updateCallback) {
          updateCallback(BsClaim.pool[claimKey].alias)
        }
        return BsClaim.save(BsClaim.pool[claimKey])
      })
    }, Promise.resolve())
    return requests
  }

  public static storeAttestation = (attestedClaim: sdk.IAttestedClaim) => {
    PersistentStore.store.dispatch(Claims.Store.addAttestation(attestedClaim))
  }
}

export { BsClaim, BsClaimsPool }
