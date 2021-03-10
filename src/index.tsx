import React from 'react'
import * as ReactDOM from 'react-dom'

// import LoginGate from './containers/LoginGate/LoginGate'
// import StoreGate from './containers/StoreGate/StoreGate'
import { Provider } from 'react-redux'
import App from './App'
import { persistentStoreInstance } from './state/PersistentStore'

ReactDOM.render(
  // <LoginGate>
  //   <StoreGate>
  <Provider store={persistentStoreInstance.store}>
    <App />
  </Provider>,
  //   </StoreGate>
  // </LoginGate>,
  document.getElementById('root') as HTMLElement
)
