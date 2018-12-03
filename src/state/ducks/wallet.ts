import Identity from '../../types/Identity'

// Types & Interfaces
type Action = {
  type: string
  payload: any
}
interface ISaveAction extends Action {
  payload: {
    alias: string
    identity: Identity
  }
}
interface IRemoveAction extends Action {
  payload: string
}
type WalletAction = ISaveAction | IRemoveAction

interface IWalletState {
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
) {
  switch (action.type) {
    case SAVE_USER:
      action = action as ISaveAction
      const { alias, identity } = action.payload
      state = {
        [identity.seedAsHex]: {
          alias,
          identity,
        },
        ...state,
      }
      break
    case REMOVE_USER:
      action = action as IRemoveAction
      const { [action.payload]: value, ...rest } = state
      state = rest
      break
  }
  return state
}

// Action Creators
export function saveUser(alias: string, identity: Identity) {
  return { type: SAVE_USER, payload: { alias, identity } }
}

export function removeUser(seedAsHex: string) {
  return { type: REMOVE_USER, payload: seedAsHex }
}
