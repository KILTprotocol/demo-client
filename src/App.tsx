import * as React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

import './App.scss'
import Header from './components/Header/Header'
import BlockingNotifications from './containers/BlockingNotifications/BlockingNotifications'
import BlockUi from './containers/BlockUi/BlockUi'
import Notifications from './containers/Notifications/Notifications'
import Tasks from './containers/Tasks/Tasks'
import Routes from './routes'
import './utils/Polyfills'

class App extends React.Component {
  public render() {
    return (
      <Router>
        <div className="App">
          <Header />
          <Routes />
          <BlockUi />
          <BlockingNotifications />
          <Notifications />
          <Tasks />
        </div>
      </Router>
    )
  }
}

export default App
