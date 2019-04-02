import { CType, Claim, IAttestedClaim } from '@kiltprotocol/prototype-sdk'

import * as Claims from '../../state/ducks/Claims'
import PersistentStore from '../../state/PersistentStore'

import { getIdentity, getCtype } from './DevTools.utils'

export const saveClaim = async (
  ctypeAlias: string,
  claimAlias: string,
  claimObj: object,
  identityAlias: string
) => {
  const identity = getIdentity(identityAlias)
  const localCtype = await getCtype(ctypeAlias)
  if (!localCtype || !identity) {
    return false
  }

  // TODO: the ctype object should be already initialised
  const ctype = CType.fromObject(localCtype.cType)

  const claim = new Claim(ctype, claimObj, identity.identity)

  PersistentStore.store.dispatch(
    Claims.Store.saveAction(claim, { alias: claimAlias })
  )

  return claim
}

export const storeAttestationForClaim = (attestedClaim: IAttestedClaim) => {
  PersistentStore.store.dispatch(Claims.Store.addAttestation(attestedClaim))
}
