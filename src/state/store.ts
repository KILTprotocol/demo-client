import { combineReducers, createStore } from 'redux'

import Identity from '../types/Identity'
import walletReducer from './ducks/wallet'

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }
}

const localState = localStorage.getItem('reduxState')
let persistedState = {}
if (localState) {
  persistedState = JSON.parse(localState)
  persistedState = deserialize(persistedState)
}

const store = createStore(
  combineReducers({ wallet: walletReducer }),
  persistedState,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

store.subscribe(() => {
  localStorage.setItem('reduxState', JSON.stringify(store.getState()))
})

export default store

function deserialize(state: any) {
  Object.keys(state.wallet).forEach(key => {
    state.wallet[key].identity = new Identity(
      state.wallet[key].identity._phrase
    )
  })
  return state
}
