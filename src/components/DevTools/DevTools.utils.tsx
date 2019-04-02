import { Contact, MyIdentity } from '../../types/Contact'

import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore from '../../state/PersistentStore'

import CtypeRepository from '../../services/CtypeRepository'

export const getIdentity = (alias: string) => {
  const identities = Wallet.getAllIdentities(PersistentStore.store.getState())

  return identities.find(value => {
    if (value.metaData.name === alias) {
      return true
    }
    return false
  })
}

export const toContact = (identity: MyIdentity) => {
  const contact: Contact = {
    metaData: identity.metaData,
    publicIdentity: identity.identity,
  }

  return contact
}

export const getContact = (alias: string) => {
  const identity = getIdentity(alias)

  if (!identity) {
    return null
  }

  return toContact(identity)
}

export const getCtype = async (alias: string) => {
  const ctypes = await CtypeRepository.findAll()

  return ctypes.find(value => {
    if (value.cType.metadata.title.default === alias) {
      return true
    }
    return false
  })
}
