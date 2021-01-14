import { combineReducers, createStore, Store } from 'redux'
import nacl from 'tweetnacl'
import { u8aToHex } from '@kiltprotocol/sdk-js/build/crypto'
import {
  encryption,
  decryption,
  passwordHashing,
} from '../utils/Encryption/Encryption'

import * as Attestations from './ducks/Attestations'
import * as Balances from './ducks/Balances'
import * as Claims from './ducks/Claims'
import * as UiState from './ducks/UiState'
import * as Wallet from './ducks/Wallet'
import * as Delegations from './ducks/Delegations'
import * as Parameters from './ducks/Parameters'
import * as Contacts from './ducks/Contacts'
import * as CTypes from './ducks/CTypes'
import * as Quotes from './ducks/Quotes'

declare global {
  /* eslint-disable */
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }

  /* eslint-enable */
}

export type State = {
  attestations: Attestations.ImmutableState
  balances: Balances.ImmutableState
  claims: Claims.ImmutableState
  contacts: Contacts.ImmutableState
  cTypes: CTypes.ImmutableState
  delegations: Delegations.ImmutableState
  parameters: Parameters.ImmutableState
  quotes: Quotes.ImmutableState
  uiState: UiState.ImmutableState
  wallet: Wallet.ImmutableState
}

type SerializedState = {
  attestations: Attestations.SerializedState
  claims: Claims.SerializedState
  contacts: Contacts.SerializedState
  delegations: Delegations.SerializedState
  parameters: Parameters.SerializedState
  quotes: Quotes.SerializedState
  uiState: UiState.SerializedState
  wallet: Wallet.SerializedState
}

class PersistentStore {
  public get store(): Store {
    return this.storeInternal
  }

  private static NAME = 'reduxState'
  private static SALT = 'salt'

  private static async deserialize(
    encryptedState: string
  ): Promise<Partial<State>> {
    const obj = JSON.parse(encryptedState)
    return {
      attestations: Attestations.Store.deserialize(obj.attestations),
      claims: Claims.Store.deserialize(obj.claims),
      contacts: Contacts.Store.deserialize(obj.contacts),
      delegations: Delegations.Store.deserialize(obj.delegations),
      parameters: Parameters.Store.deserialize(obj.parameters),
      quotes: Quotes.Store.deserialize(obj.quotes),
      uiState: UiState.Store.deserialize(),
      wallet: await Wallet.Store.deserialize(obj.wallet),
    }
  }

  private static serialize(state: State): string {
    const obj: SerializedState = {
      attestations: Attestations.Store.serialize(state.attestations),
      claims: Claims.Store.serialize(state.claims),
      contacts: Contacts.Store.serialize(state.contacts),
      delegations: Delegations.Store.serialize(state.delegations),
      parameters: Parameters.Store.serialize(state.parameters),
      quotes: Quotes.Store.serialize(state.quotes),
      uiState: UiState.Store.serialize(),
      wallet: Wallet.Store.serialize(state.wallet),
    }

    return JSON.stringify(obj)
  }

  private storeInternal: Store

  public async init(): Promise<Store> {
    const localState = localStorage.getItem(PersistentStore.NAME)
    let salt = localStorage.getItem(PersistentStore.SALT)

    if (!salt) {
      salt = u8aToHex(nacl.randomBytes(24))
      localStorage.setItem(PersistentStore.SALT, salt)
    }

    const password = await passwordHashing('password', salt)
    let persistedState: Partial<State> = {}
    if (localState) {
      try {
        const decryptedState = decryption(localState, password)
        if (decryptedState) {
          persistedState = await PersistentStore.deserialize(decryptedState)
        }
      } catch (error) {
        console.error('Could not construct persistentStore', error)
      }
    }

    this.storeInternal = createStore(
      combineReducers({
        attestations: Attestations.Store.reducer,
        balances: Balances.Store.reducer,
        cTypes: CTypes.Store.reducer,
        claims: Claims.Store.reducer,
        contacts: Contacts.Store.reducer,
        delegations: Delegations.Store.reducer,
        parameters: Parameters.Store.reducer,
        quotes: Quotes.Store.reducer,
        uiState: UiState.Store.reducer,
        wallet: Wallet.Store.reducer,
      }),
      persistedState,
      // eslint-disable-next-line no-underscore-dangle
      window.__REDUX_DEVTOOLS_EXTENSION__ &&
        // eslint-disable-next-line no-underscore-dangle
        window.__REDUX_DEVTOOLS_EXTENSION__()
    )

    this.storeInternal.subscribe(() => {
      const serializedState = PersistentStore.serialize(
        this.storeInternal.getState()
      )
      const encryptedState = encryption(serializedState, password)
      localStorage.setItem(PersistentStore.NAME, JSON.stringify(encryptedState))
    })

    return this.storeInternal
  }

  // eslint-disable-next-line class-methods-use-this
  public reset(): void {
    localStorage.clear()
  }
}

export default new PersistentStore()
