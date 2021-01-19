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

export class PersistentStore {
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

  public static createSalt(): void {
    const salt = u8aToHex(nacl.randomBytes(24))
    localStorage.setItem(PersistentStore.SALT, salt)
  }

  public static async createLocalState(password: string): Promise<void> {
    const hashedPassword = await PersistentStore.getHashedPassword(password)
    const combinedReducers = PersistentStore.getCombinedReducers()
    const state = combinedReducers({} as State, { type: '' })
    PersistentStore.serializeEncryptAndStore(state, hashedPassword)
  }

  public static getLocalState(): string | null {
    return localStorage.getItem(PersistentStore.NAME)
  }

  public static getLocalSalt(): string | null {
    return localStorage.getItem(PersistentStore.SALT)
  }

  public static async getHashedPassword(password: string): Promise<Uint8Array> {
    const salt = PersistentStore.getLocalSalt()
    if (!salt) throw new Error('No password salt found')

    return passwordHashing(password, salt)
  }

  public static async decrypt(password: string): Promise<string | null> {
    const localState = PersistentStore.getLocalState()

    const hashedPassword = await PersistentStore.getHashedPassword(password)
    if (!localState) throw new Error('LocalState not found')

    return decryption(localState, hashedPassword)
  }

  public static async decryptAndDeserialize(
    password: string
  ): Promise<Partial<State>> {
    const decryptedState = await PersistentStore.decrypt(password)
    if (!decryptedState) throw new Error('Store could not be decrypted')
    const persistedState = await PersistentStore.deserialize(decryptedState)

    return persistedState
  }

  public static serializeEncryptAndStore(
    state: State,
    hashedPassword: Uint8Array
  ): void {
    const serializedState = PersistentStore.serialize(state)
    const encryptedState = encryption(serializedState, hashedPassword)
    localStorage.setItem(PersistentStore.NAME, JSON.stringify(encryptedState))
  }

  public static clearLocalStorage(): void {
    localStorage.removeItem(PersistentStore.NAME)
    localStorage.removeItem(PersistentStore.SALT)
  }

  /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
  public static getCombinedReducers() {
    return combineReducers({
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
    })
  }

  public async init(password: string): Promise<Store> {
    const persistedState = await PersistentStore.decryptAndDeserialize(password)

    this.storeInternal = createStore(
      PersistentStore.getCombinedReducers(),
      persistedState,
      // eslint-disable-next-line no-underscore-dangle
      window.__REDUX_DEVTOOLS_EXTENSION__ &&
        // eslint-disable-next-line no-underscore-dangle
        window.__REDUX_DEVTOOLS_EXTENSION__()
    )

    const hashedPassword = await PersistentStore.getHashedPassword(password)
    this.storeInternal.subscribe(() => {
      PersistentStore.serializeEncryptAndStore(
        this.storeInternal.getState(),
        hashedPassword
      )
    })

    return this.storeInternal
  }

  // eslint-disable-next-line class-methods-use-this
  public reset(): void {
    localStorage.clear()
  }
}

export const persistentStoreInstance = new PersistentStore()
