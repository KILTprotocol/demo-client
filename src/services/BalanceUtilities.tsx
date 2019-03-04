import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import ContactPresentation from '../components/ContactPresentation/ContactPresentation'
import * as Balances from '../state/ducks/Balances'
import PersistentStore from '../state/PersistentStore'
import { MyIdentity } from '../types/Contact'
import BlockchainService from './BlockchainService'
import { notify } from './FeedbackService'

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
          <span className={`kilt-tokens ${inDeCreased}`}>{change}</span>.
        </div>
      )
    }
    PersistentStore.store.dispatch(
      Balances.Store.updateBalance(account, balance)
    )
  }
}

export default BalanceUtilities
