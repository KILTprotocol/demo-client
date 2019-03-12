import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { Store } from 'redux'

import ContactPresentation from '../components/ContactPresentation/ContactPresentation'
import * as Balances from '../state/ducks/Balances'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import { Contact, MyIdentity } from '../types/Contact'
import BlockchainService from './BlockchainService'
import { notify, notifySuccess } from './FeedbackService'

// TODO: do we need to do something upon deleting an identity?
class BalanceUtilities {
  public static async connect(myIdentity: MyIdentity) {
    const blockchain = await BlockchainService.connect()

    if (
      Balances.getBalance(
        PersistentStore.store.getState(),
        myIdentity.identity.address
      ) == null
    ) {
      blockchain
        .listenToBalanceChanges(
          myIdentity.identity.address,
          BalanceUtilities.listener
        )
        .then(() => {
          notify(
            <div>
              Now listening to balance changes of{' '}
              <ContactPresentation myIdentity={myIdentity} />
            </div>
          )
        })
    }
  }

  public static async getMyBalance(identity: MyIdentity): Promise<number> {
    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    return blockchain.getBalance(identity.identity.address)
  }

  public static connectMyIdentities(store: Store = PersistentStore.store) {
    Wallet.getAllIdentities(store.getState()).forEach(
      (myIdentity: MyIdentity) => {
        BalanceUtilities.connect(myIdentity)
      }
    )
  }

  public static async makeTransfer(
    myIdentity: MyIdentity,
    receiverAddress: Contact['publicIdentity']['address'],
    amount: number,
    successCallback?: () => void
  ) {
    const blockchain = await BlockchainService.connect()

    blockchain
      .makeTransfer(myIdentity.identity, receiverAddress, amount, () => {
        notifySuccess(
          <div>
            <span>Successfully transfered </span>
            <span className="kilt-token">{amount}</span>
            <span> to </span>
            <ContactPresentation address={receiverAddress} />.
          </div>
        )
        if (successCallback) {
          successCallback()
        }
      })
      .then(() => {
        notify(
          <div>
            <span>Transfer of </span>
            <span className="kilt-token">{amount}</span>
            <span> to </span>
            <ContactPresentation address={receiverAddress} />
            <span> initiated.</span>
          </div>
        )
      })
  }

  private static async listener(
    account: sdk.PublicIdentity['address'],
    balance: number,
    change: number
  ) {
    if (change !== 0) {
      const inDeCreased = `${change > 0 ? 'in' : 'de'}creased`
      notify(
        <div>
          Balance of <ContactPresentation address={account} /> {inDeCreased} by{' '}
          <span className={`kilt-token ${inDeCreased}`}>{change}</span>.
        </div>
      )
    }
    PersistentStore.store.dispatch(
      Balances.Store.updateBalance(account, balance)
    )
  }
}

export default BalanceUtilities
