import Immutable from 'immutable'
import { combineReducers, createStore, Store } from 'redux'
import Identity from '../types/Identity'
import WalletRedux, { WalletState, WalletStateEntry } from './ducks/WalletRedux'

declare global {
  /* tslint:disable */
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }
  /* tslint:enable */
}

class PersistentStore {
  public get store() {
    return this._store
  }

  private static NAME = 'reduxState'

  // TODO: use interface/type for (de)serialized state, instead of any
  private static deserialize(obj: any): { wallet: WalletState } {
    const identities = {}
    let selected: WalletStateEntry | null = null

    // TODO: move to WalletRedux as every state needs a special implementation
    Object.keys(obj.wallet.identities).forEach(i => {
      const o = obj.wallet.identities[i]
      const identity = new Identity(o.phrase)
      const entry = { alias: o.alias, identity }
      identities[identity.seedAsHex] = entry

      if (
        obj.wallet.selectedIdentityAsSeedAsHex &&
        obj.wallet.selectedIdentityAsSeedAsHex === identity.seedAsHex
      ) {
        selected = entry
      }
    })

    return {
      wallet: WalletRedux.createState({
        identities: Immutable.Map(identities),
        selected,
      }),
    }
  }

  private static serialize(state: { wallet: WalletState }): any {
    const obj: {
      wallet: {
        identities: Array<{ alias: string; phrase: string }>
        selectedIdentityAsSeedAsHex?: string
      }
    } = {
      wallet: {
        identities: [],
      },
    }

    // TODO: move to WalletRedux as every state needs a special implementation
    obj.wallet.identities = state.wallet
      .get('identities')
      .toList()
      .map(i => ({ alias: i.alias, phrase: i.identity.phrase }))
      .toArray()

    const selected = state.wallet.get('selected')
    if (selected) {
      obj.wallet.selectedIdentityAsSeedAsHex = selected.identity.seedAsHex
    }

    return JSON.stringify(obj)
  }

  private _store: Store

  constructor() {
    const localState = localStorage.getItem(PersistentStore.NAME)
    let persistedState = {}
    if (localState) {
      persistedState = JSON.parse(localState)
      persistedState = PersistentStore.deserialize(persistedState)
    }

    this._store = createStore(
      combineReducers({ wallet: WalletRedux.reducer }),
      persistedState,
      window.__REDUX_DEVTOOLS_EXTENSION__ &&
        window.__REDUX_DEVTOOLS_EXTENSION__()
    )

    this._store.subscribe(() => {
      localStorage.setItem(
        PersistentStore.NAME,
        PersistentStore.serialize(this._store.getState())
      )
    })
  }
}

export default new PersistentStore()
