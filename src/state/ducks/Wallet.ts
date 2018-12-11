import Immutable from 'immutable'
import Identity from '../../types/Identity'
import Action from '../Action'

// Types & Interfaces
interface ISaveAction extends Action {
  payload: {
    alias: string
    identity: Identity
  }
}
interface IRemoveAction extends Action {
  payload: string
}
export type WalletAction = ISaveAction | IRemoveAction

export interface IAliasIdentity {
  alias: string
  identity: Identity
}

export type IWalletState = Immutable.Map<string, IAliasIdentity>

// Actions
const SAVE_USER = 'client/wallet/SAVE_USER'
const REMOVE_USER = 'client/wallet/REMOVE_USER'

// Reducer
export default function reducer(
  state: IWalletState = Immutable.Map(),
  action: WalletAction
): IWalletState {
  switch (action.type) {
    case SAVE_USER:
      const { alias, identity } = (action as ISaveAction).payload
      return state.set(identity.seedAsHex, { alias, identity })
    case REMOVE_USER:
      const key = (action as IRemoveAction).payload
      return state.delete(key)
    default:
      return state
  }
}

// Action Creators
export function saveUser(alias: string, identity: Identity): ISaveAction {
  return { type: SAVE_USER, payload: { alias, identity } }
}

export function removeUser(seedAsHex: string): IRemoveAction {
  return { type: REMOVE_USER, payload: seedAsHex }
}
