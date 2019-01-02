import { combineReducers, createStore, Store } from 'redux'
import * as Claims from './ducks/Claims'
import * as Wallet from './ducks/Wallet'

declare global {
  /* tslint:disable */
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }
  /* tslint:enable */
}

type State = {
  claims: Claims.ImmutableState
  wallet: Wallet.ImmutableState
}

type SerializedState = {
  claims: Claims.SerializedState
  wallet: Wallet.SerializedState
}

class PersistentStore {
  public get store() {
    return this._store
  }

  private static NAME = 'reduxState'

  private static deserialize(obj: SerializedState): State {
    return {
      claims: Claims.Store.deserialize(obj.claims),
      wallet: Wallet.Store.deserialize(obj.wallet),
    }
  }

  private static serialize(state: State): string {
    const obj: SerializedState = {
      claims: Claims.Store.serialize(state.claims),
      wallet: Wallet.Store.serialize(state.wallet),
    }

    return JSON.stringify(obj)
  }

  private _store: Store

  constructor() {
    const localState = localStorage.getItem(PersistentStore.NAME)
    let persistedState = {} as State
    if (localState) {
      const storedState = JSON.parse(localState)
      persistedState = PersistentStore.deserialize(storedState)
    }

    this._store = createStore(
      combineReducers({
        claims: Claims.Store.reducer,
        wallet: Wallet.Store.reducer,
      }),
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
