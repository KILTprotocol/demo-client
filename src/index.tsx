import React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import App from './App'
import persistentStore from './state/PersistentStore'

// eslint-disable-next-line import/newline-after-import
;(async () => {
  const store = await persistentStore.init()
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root') as HTMLElement
  )
})()

// registerServiceWorker()
