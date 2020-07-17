import * as sdk from '@kiltprotocol/sdk-js'
import BN from 'bn.js'
import React from 'react'
import { Store } from 'redux'
import ContactPresentation from '../components/ContactPresentation/ContactPresentation'
import KiltToken from '../components/KiltToken/KiltToken'
import * as Balances from '../state/ducks/Balances'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import { IContact, IMyIdentity } from '../types/Contact'
import { notify, notifySuccess } from './FeedbackService'

const KILT_COIN = 1
const KILT_MICRO_COIN = 1_000_000
const KILT_FEMTO_COIN = '1000000000000000'

// cost of a chain transaction
const TRANSACTION_FEE = 1 * KILT_COIN

// any balance below this will we purged
const MIN_BALANCE = 1 * KILT_COIN

// initial endowment for automatically created accounts
const ENDOWMENT = 30 * KILT_COIN

// TODO: do we need to do something upon deleting an identity?
class BalanceUtilities {
  public static connect(myIdentity: IMyIdentity): void {
    if (
      Balances.getBalance(
        PersistentStore.store.getState(),
        myIdentity.identity.getAddress()
      ) == null
    ) {
      sdk.Balance.listenToBalanceChanges(
        myIdentity.identity.getAddress(),
        BalanceUtilities.listener
      ).then(() => {
        notify(
          <div>
            Now listening to balance changes of{' '}
            <ContactPresentation
              address={myIdentity.identity.getAddress()}
              inline
            />
          </div>
        )
      })
    }
  }

  public static async getMyBalance(identity: IMyIdentity): Promise<number> {
    const balance: BN = await sdk.Balance.getBalance(
      identity.identity.getAddress()
    )
    return BalanceUtilities.asKiltCoin(balance)
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
    amount: number,
    successCallback?: () => void
  ): void {
    const transferAmount: BN = BalanceUtilities.asFemtoKilt(amount)
    notify(
      <div>
        <span>Transfer of </span>
        <KiltToken amount={amount} />
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
            <KiltToken amount={amount} />
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
            <KiltToken amount={amount} />
            <span> to </span>
            <ContactPresentation address={receiverAddress} inline />
            <span> initiated.</span>
          </div>
        )
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
          <KiltToken amount={BalanceUtilities.asKiltCoin(change)} colored />.
        </div>
      )
    }
    PersistentStore.store.dispatch(
      Balances.Store.updateBalance(
        account,
        BalanceUtilities.asKiltCoin(balance)
      )
    )
  }

  public static asKiltCoin(balance: BN): number {
    return balance.div(new BN(KILT_FEMTO_COIN)).toNumber()
  }

  public static asMicroKilt(balance: number): BN {
    return new BN(balance).muln(KILT_MICRO_COIN)
  }

  public static asFemtoKilt(balance: number): BN {
    return new BN(balance).mul(new BN(KILT_FEMTO_COIN))
  }
}

export { BalanceUtilities, ENDOWMENT, TRANSACTION_FEE, MIN_BALANCE }
