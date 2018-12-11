import Immutable from 'immutable'
import { combineReducers, createStore } from 'redux'
import Identity from '../types/Identity'
import walletReducer, { IWalletState } from './ducks/wallet'

declare global {
  /* tslint:disable */
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }
  /* tslint:enable */
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

function deserialize(obj: any): { wallet: IWalletState } {
  const wallet = {}

  Object.keys(obj.wallet).forEach(key => {
    const o = obj.wallet[key]
    wallet[key] = {
      alias: o.alias,
      identity: new Identity(o.identity._phrase),
    }
  })

  return {
    wallet: Immutable.Map(wallet),
  }
}
