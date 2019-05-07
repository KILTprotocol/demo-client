import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { Store } from 'redux'

import ContactPresentation from '../components/ContactPresentation/ContactPresentation'
import KiltToken from '../components/KiltToken/KiltToken'
import * as Balances from '../state/ducks/Balances'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import { Contact, MyIdentity } from '../types/Contact'
import BlockchainService from './BlockchainService'
import { notify, notifySuccess } from './FeedbackService'

// the amount of tokens that make up 1 (one) Kilt
const KILT = 1_000_000

// initial endowment for automatically created accounts
const ENDOWMENT = 100 * KILT

// TODO: do we need to do something upon deleting an identity?
class BalanceUtilities {
  public static displayTokenRatio = 1000000
  public static transactionFee = 1000000
  public static tokenThreshold = 1000000

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
              <ContactPresentation
                address={myIdentity.identity.address}
                inline={true}
              />
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
      .makeTransfer(myIdentity.identity, receiverAddress, amount)
      .then((result: any) => {
        notifySuccess(
          <div>
            <span>Successfully transfered </span>
            <KiltToken amount={amount} />
            <span> to </span>
            <ContactPresentation address={receiverAddress} inline={true} />.
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
            <KiltToken amount={amount} />
            <span> to </span>
            <ContactPresentation address={receiverAddress} inline={true} />
            <span> initiated.</span>
          </div>
        )
      })
  }

  public static convertTokenForExternal(bigNumber: number): number {
    return bigNumber / BalanceUtilities.displayTokenRatio
  }

  public static convertTokenForInternal(smallNumber: number): number {
    return smallNumber * BalanceUtilities.displayTokenRatio
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
          <KiltToken amount={change} colored={true} />.
        </div>
      )
    }
    PersistentStore.store.dispatch(
      Balances.Store.updateBalance(account, balance)
    )
  }
}

export { BalanceUtilities, KILT, ENDOWMENT }
