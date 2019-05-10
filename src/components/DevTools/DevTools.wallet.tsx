import { Identity } from '@kiltprotocol/prototype-sdk'
import { mnemonicGenerate } from '@polkadot/util-crypto/mnemonic'
import { BalanceUtilities, ENDOWMENT } from '../../services/BalanceUtilities'
import ContactRepository from '../../services/ContactRepository'
import { notifySuccess } from '../../services/FeedbackService'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import identitiesPool from './data/identities.json'

type UpdateCallback = (bsIdentityKey: keyof BsIdentitiesPool) => void

type BsIdentitiesPool = {
  [key: string]: string
}

class BsIdentity {
  public static pool: BsIdentitiesPool = identitiesPool as BsIdentitiesPool

  public static createPool(
    updateCallback?: UpdateCallback
  ): Promise<void | MyIdentity> {
    const identityLabels = Object.keys(BsIdentity.pool)
    const requests = identityLabels.reduce((promiseChain, bsIdentityKey) => {
      return promiseChain.then(() => {
        if (updateCallback) {
          updateCallback(BsIdentity.pool[bsIdentityKey])
        }
        return BsIdentity.create(BsIdentity.pool[bsIdentityKey])
      })
    }, Promise.resolve())
    return requests
  }

  public static async create(alias: string): Promise<void | MyIdentity> {
    const randomPhrase = mnemonicGenerate()
    const identity = Identity.buildFromMnemonic(randomPhrase)

    return BsIdentity.save(identity, randomPhrase, alias)
  }

  public static save(
    identity: Identity,
    phrase: string,
    alias: string
  ): Promise<void | MyIdentity> {
    const selectedIdentity: MyIdentity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    )

    return new Promise((resolve, reject) => {
      BalanceUtilities.makeTransfer(
        selectedIdentity,
        identity.address,
        ENDOWMENT,
        () => {
          const { address, boxPublicKeyAsHex } = identity
          const newContact: Contact = {
            metaData: {
              name: alias,
            },
            publicIdentity: { address, boxPublicKeyAsHex },
          }
          PersistentStore.store.dispatch(Contacts.Store.addContact(newContact))

          const newIdentity = {
            identity,
            metaData: {
              name: alias,
            },
            phrase,
          } as MyIdentity
          PersistentStore.store.dispatch(
            Wallet.Store.saveIdentityAction(newIdentity)
          )
          PersistentStore.store.dispatch(
            Contacts.Store.addContact(
              ContactRepository.getContactFromIdentity(newIdentity, {
                unregistered: true,
              })
            )
          )
          BalanceUtilities.connect(newIdentity)
          notifySuccess(`Identity ${alias} successfully created.`)

          resolve(newIdentity)
        }
      )
    })
  }

  public static async getByKey(
    bsIdentitiesPoolKey: keyof BsIdentitiesPool
  ): Promise<MyIdentity> {
    const identities = Wallet.getAllIdentities(PersistentStore.store.getState())
    const identity = identities.find(
      value => value.metaData.name === BsIdentity.pool[bsIdentitiesPoolKey]
    )
    if (identity) {
      return identity
    }
    throw new Error(`Identity '${bsIdentitiesPoolKey}' not found`)
  }

  public static async selectIdentity(identity: MyIdentity): Promise<void> {
    PersistentStore.store.dispatch(
      Wallet.Store.selectIdentityAction(identity.identity.address)
    )
  }

  public static async selectIdentityByKey(
    bsIdentitiesPoolKey: keyof BsIdentitiesPool
  ): Promise<void> {
    const identity = await BsIdentity.getByKey(bsIdentitiesPoolKey)
    BsIdentity.selectIdentity(identity)
  }
}

export { BsIdentitiesPool, BsIdentity }
