import { createStore, combineReducers } from 'redux'

import walletReducer from './ducks/wallet'

export default createStore(
  combineReducers({ wallet: walletReducer }),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)
