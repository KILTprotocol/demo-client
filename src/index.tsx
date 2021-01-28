import React from 'react'
import * as ReactDOM from 'react-dom'

import LoginGate from './containers/LoginGate/LoginGate'
import StoreGate from './containers/StoreGate/StoreGate'
import App from './App'

ReactDOM.render(
  <LoginGate>
    <StoreGate>
      <App />
    </StoreGate>
  </LoginGate>,
  document.getElementById('root') as HTMLElement
)
