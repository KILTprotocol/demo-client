import Immutable from 'immutable'
import { combineReducers, createStore, Store } from 'redux'
import Identity from '../types/Identity'
import WalletRedux, { WalletState } from './ducks/WalletRedux'

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

  private static deserialize(obj: any): { wallet: WalletState } {
    const wallet = {}

    Object.keys(obj.wallet).forEach(key => {
      const o = obj.wallet[key]
      wallet[key] = {
        alias: o.alias,
        identity: new Identity(o.phrase),
      }
    })

    return {
      wallet: Immutable.Map(wallet),
    }
  }

  private static serialize(state: { wallet: WalletState }): any {
    const obj: {
      wallet: Array<{ alias: string; phrase: string }>
    } = {
      wallet: [],
    }

    obj.wallet = state.wallet
      .toList()
      .map(i => ({ alias: i.alias, phrase: i.identity.phrase }))
      .toArray()

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
