import * as sdk from '@kiltprotocol/sdk-js'
import BN from 'bn.js'
import React from 'react'
import { Store } from 'redux'
import ContactPresentation from '../components/ContactPresentation/ContactPresentation'
import KiltToken from '../components/KiltToken/KiltToken'
import * as Balances from '../state/ducks/Balances'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import errorService from './ErrorService'
import { IContact, IMyIdentity } from '../types/Contact'
import { notify, notifySuccess, notifyFailure } from './FeedbackService'

// any balance below this will we purged
const MIN_BALANCE = sdk.BalanceUtils.KILT_COIN.muln(1)

// initial endowment for automatically created accounts
const ENDOWMENT = sdk.BalanceUtils.KILT_COIN.muln(30)

// TODO: do we need to do something upon deleting an identity?
class BalanceUtilities {
  public static connect(myIdentity: IMyIdentity): void {
    if (
      Balances.getBalance(
        PersistentStore.store.getState(),
        myIdentity.identity.address
      ) == null
    ) {
      sdk.Balance.listenToBalanceChanges(
        myIdentity.identity.address,
        BalanceUtilities.listener
      ).then(() => {
        notify(
          <div>
            Now listening to balance changes of{' '}
            <ContactPresentation address={myIdentity.identity.address} inline />
          </div>
        )
      })
    }
  }

  public static async getMyBalance(identity: IMyIdentity): Promise<BN> {
    const balance: BN = await sdk.Balance.getBalance(identity.identity.address)
    return balance
  }

  public static connectMyIdentities(
    store: Store = PersistentStore.store
  ): void {
    Wallet.getAllIdentities(store.getState()).forEach(
      (myIdentity: IMyIdentity) => {
        BalanceUtilities.connect(myIdentity)
      }
    )
  }

  public static makeTransfer(
    myIdentity: IMyIdentity,
    receiverAddress: IContact['publicIdentity']['address'],
    amount: BN,
    successCallback?: () => void
  ): void {
    const transferAmount = sdk.BalanceUtils.asFemtoKilt(amount)
    notify(
      <div>
        <span>Transfer of </span>
        <KiltToken amount={transferAmount} />
        <span> to </span>
        <ContactPresentation address={receiverAddress} inline /> initiated.
      </div>
    )
    sdk.Balance.makeTransfer(
      myIdentity.identity,
      receiverAddress,
      transferAmount
    )
      .then(() => {
        notifySuccess(
          <div>
            <span>Successfully transferred </span>
            <KiltToken amount={transferAmount} />
            <span> to </span>
            <ContactPresentation address={receiverAddress} inline />.
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
            <KiltToken amount={transferAmount} />
            <span> to </span>
            <ContactPresentation address={receiverAddress} inline />
            <span> initiated.</span>
          </div>
        )
      })
      .catch(error => {
        errorService.log({
          error,
          message: '1010: Invalid Transaction',
          origin: 'BalanceUtilities.makeTransfer()',
        })
        notifyFailure('1010: Invalid Transaction')
      })
  }

  private static listener(
    account: sdk.PublicIdentity['address'],
    balance: BN,
    change: BN
  ): void {
    if (!change.isZero()) {
      const inDeCreased = `${change.gtn(0) ? 'in' : 'de'}creased`

      notify(
        <div>
          Balance of <ContactPresentation address={account} /> {inDeCreased} by{' '}
          <KiltToken amount={change} colored />.
        </div>
      )
    }
    PersistentStore.store.dispatch(
      Balances.Store.updateBalance(account, balance)
    )
  }
}
export { BalanceUtilities, MIN_BALANCE, ENDOWMENT }
