import Identity from '../../types/Identity'

type Action = {
  type?: string
  payload?: any
}

type State = any

// Actions
const SAVE_USER = 'client/wallet/SAVE_USER'
const REMOVE_USER = 'client/wallet/REMOVE_USER'

// Reducer
export default function reducer(state: State = {}, action: Action = {}) {
  switch (action.type) {
    case SAVE_USER:
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
