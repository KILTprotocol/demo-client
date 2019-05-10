import { combineReducers, createStore, Store } from 'redux'
import { BalanceUtilities } from '../services/BalanceUtilities'

import * as Attestations from './ducks/Attestations'
import * as Balances from './ducks/Balances'
import * as Claims from './ducks/Claims'
import * as UiState from './ducks/UiState'
import * as Wallet from './ducks/Wallet'
import * as Delegations from './ducks/Delegations'
import * as Parameters from './ducks/Parameters'
import * as Contacts from './ducks/Contacts'
import * as CTypes from './ducks/CTypes'

declare global {
  /* tslint:disable */
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }

  /* tslint:enable */
}

export type State = {
  attestations: Attestations.ImmutableState
  balances: Balances.ImmutableState
  claims: Claims.ImmutableState
  contacts: Contacts.ImmutableState
  cTypes: CTypes.ImmutableState
  delegations: Delegations.ImmutableState
  parameters: Parameters.ImmutableState
  uiState: UiState.ImmutableState
  wallet: Wallet.ImmutableState
}

type SerializedState = {
  attestations: Attestations.SerializedState
  claims: Claims.SerializedState
  contacts: Contacts.SerializedState
  delegations: Delegations.SerializedState
  parameters: Parameters.SerializedState
  uiState: UiState.SerializedState
  wallet: Wallet.SerializedState
}

class PersistentStore {
  public get store() {
    return this._store
  }

  private static NAME = 'reduxState'

  private static deserialize(obj: SerializedState): Partial<State> {
    return {
      attestations: Attestations.Store.deserialize(obj.attestations),
      claims: Claims.Store.deserialize(obj.claims),
      contacts: Contacts.Store.deserialize(obj.contacts),
      delegations: Delegations.Store.deserialize(obj.delegations),
      parameters: Parameters.Store.deserialize(obj.parameters),
      uiState: UiState.Store.deserialize(obj.uiState),
      wallet: Wallet.Store.deserialize(obj.wallet),
    }
  }

  private static serialize(state: State): string {
    const obj: SerializedState = {
      attestations: Attestations.Store.serialize(state.attestations),
      claims: Claims.Store.serialize(state.claims),
      contacts: Contacts.Store.serialize(state.contacts),
      delegations: Delegations.Store.serialize(state.delegations),
      parameters: Parameters.Store.serialize(state.parameters),
      uiState: UiState.Store.serialize(state.uiState),
      wallet: Wallet.Store.serialize(state.wallet),
    }

    return JSON.stringify(obj)
  }

  private _store: Store

  constructor() {
    const localState = localStorage.getItem(PersistentStore.NAME)
    let persistedState: Partial<State> = {}
    if (localState) {
      try {
        persistedState = PersistentStore.deserialize(JSON.parse(localState))
      } catch (error) {
        console.error('Could not construct persistentStore', error)
      }
    }

    this._store = createStore(
      combineReducers({
        attestations: Attestations.Store.reducer,
        balances: Balances.Store.reducer,
        cTypes: CTypes.Store.reducer,
        claims: Claims.Store.reducer,
        contacts: Contacts.Store.reducer,
        delegations: Delegations.Store.reducer,
        parameters: Parameters.Store.reducer,
        uiState: UiState.Store.reducer,
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

  public reset(): void {
    localStorage.clear()
  }
}

export default new PersistentStore()
