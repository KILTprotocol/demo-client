import { mnemonicGenerate } from '@polkadot/util-crypto/mnemonic'
import { Blockchain, Identity } from '@kiltprotocol/prototype-sdk'

import { Contact, MyIdentity } from '../../types/Contact'

import { notifySuccess } from '../../services/FeedbackService'
import BlockchainService from '../../services/BlockchainService'
import contactRepository from '../../services/ContactRepository'
import BalanceUtilities from '../../services/BalanceUtilities'
import errorService from '../../services/ErrorService'

import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore from '../../state/PersistentStore'

export const createIdentity = (alias: string) => {
  const randomPhrase = mnemonicGenerate()
  const identity = Identity.buildFromMnemonic(randomPhrase)

  return saveIdentity(identity, randomPhrase, alias)
}

export const saveIdentity = async (
  identity: Identity,
  phrase: string,
  alias: string
) => {
  const blockchain: Blockchain = await BlockchainService.connect()
  const alice = Identity.buildFromSeedString('Alice')

  return blockchain
    .makeTransfer(alice, identity.address, 1000)
    .then((result: any) => {
      const { address, boxPublicKeyAsHex } = identity
      const newContact: Contact = {
        metaData: {
          name: alias,
        },
        publicIdentity: { address, boxPublicKeyAsHex },
      }
      return Promise.all([
        Promise.resolve(newContact),
        contactRepository.add(newContact),
      ])
    })
    .then(
      ([newContact]) => {
        const newIdentity = {
          ...newContact,
          identity,
          phrase,
        } as MyIdentity
        PersistentStore.store.dispatch(
          Wallet.Store.saveIdentityAction(newIdentity)
        )
        BalanceUtilities.connect(newIdentity)
        notifySuccess(`Identity ${alias} successfully created.`)

        return newIdentity
      },
      error => {
        errorService.log({
          error,
          message: 'failed to POST new identity',
          origin: 'WalletAdd.addIdentity()',
          type: 'ERROR.FETCH.POST',
        })
      }
    )
    .catch(error => {
      errorService.log({
        error,
        message: 'failed to transfer initial tokens to identity',
        origin: 'WalletAdd.addIdentity()',
      })
    })
}
