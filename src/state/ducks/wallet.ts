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

export interface IWalletState {
  [index: string]: {
    alias: string
    identity: Identity
  }
}

// Actions
const SAVE_USER = 'client/wallet/SAVE_USER'
const REMOVE_USER = 'client/wallet/REMOVE_USER'

// Reducer
export default function reducer(
  state: IWalletState = {},
  action: WalletAction
): IWalletState {
  let newState: IWalletState = { ...state }

  switch (action.type) {
    case SAVE_USER:
      const { alias, identity } = (action as ISaveAction).payload
      newState = {
        ...state,
        [identity.seedAsHex]: { alias, identity },
      }

      break
    case REMOVE_USER:
      const { [(action as IRemoveAction).payload]: value, ...rest } = state
      newState = rest
      break
  }

  return newState
}

// Action Creators
export function saveUser(alias: string, identity: Identity): ISaveAction {
  return { type: SAVE_USER, payload: { alias, identity } }
}

export function removeUser(seedAsHex: string): IRemoveAction {
  return { type: REMOVE_USER, payload: seedAsHex }
}
