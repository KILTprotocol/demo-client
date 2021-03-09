import { Identity } from '@kiltprotocol/sdk-js'
import { mnemonicGenerate } from '@polkadot/util-crypto/mnemonic'
import { BalanceUtilities, ENDOWMENT } from '../../services/BalanceUtilities'
import ContactRepository from '../../services/ContactRepository'
import { notifySuccess } from '../../services/FeedbackService'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import { persistentStoreInstance } from '../../state/PersistentStore'
import { IContact, IMyIdentity } from '../../types/Contact'
import identitiesPool from './data/identities.json'

type UpdateCallback = (bsIdentityKey: keyof BsIdentitiesPool) => void

export type BsIdentitiesPool = {
  [key: string]: string
}

class BsIdentity {
  public static pool: BsIdentitiesPool = identitiesPool as BsIdentitiesPool

  public static createPool(
    updateCallback?: UpdateCallback
  ): Promise<void | IMyIdentity> {
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

  public static async create(alias: string): Promise<void | IMyIdentity> {
    const randomPhrase = mnemonicGenerate()
    const identity = Identity.buildFromMnemonic(randomPhrase, {
      signingKeyPairType: 'ed25519',
    })

    return BsIdentity.save(identity, randomPhrase, alias)
  }

  public static save(
    identity: Identity,
    phrase: string,
    alias: string
  ): Promise<void | IMyIdentity> {
    const selectedIdentity:
      | IMyIdentity
      | undefined = Wallet.getSelectedIdentity(
      persistentStoreInstance.store.getState()
    )

    return new Promise((resolve, reject) => {
      if (!selectedIdentity) {
        return reject(new Error('No Identity selected'))
      }
      return BalanceUtilities.makeTransfer(
        selectedIdentity,
        identity.address,
        ENDOWMENT,
        () => {
          const newContact: IContact = {
            metaData: {
              name: alias,
            },
            publicIdentity: identity.getPublicIdentity(),
          }
          persistentStoreInstance.store.dispatch(
            Contacts.Store.addContact(newContact)
          )

          const newIdentity = {
            identity,
            metaData: {
              name: alias,
            },
            phrase,
          } as IMyIdentity
          persistentStoreInstance.store.dispatch(
            Wallet.Store.saveIdentityAction(newIdentity)
          )
          persistentStoreInstance.store.dispatch(
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
  ): Promise<IMyIdentity> {
    const identities = Wallet.getAllIdentities(
      persistentStoreInstance.store.getState()
    )
    const identity = identities.find(
      value => value.metaData.name === BsIdentity.pool[bsIdentitiesPoolKey]
    )
    if (identity) {
      return Promise.resolve(identity)
    }
    throw new Error(`Identity '${bsIdentitiesPoolKey}' not found`)
  }

  public static selectIdentity(identity: IMyIdentity): void {
    persistentStoreInstance.store.dispatch(
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

export { BsIdentity }
