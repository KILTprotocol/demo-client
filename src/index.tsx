import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import 'skeleton-css/css/normalize.css'
import 'skeleton-css/css/skeleton.css'

import './index.css'

import App from './App'
import store from './state/store'

// import registerServiceWorker from './registerServiceWorker'

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
)
// registerServiceWorker()
