import * as React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

import './App.scss'
import Header from './components/Header/Header'
import BlockingNotifications from './containers/BlockingNotifications/BlockingNotifications'
import BlockUi from './containers/BlockUi/BlockUi'
import Notifications from './containers/Notifications/Notifications'
import Routes from './routes'

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
        </div>
      </Router>
    )
  }
}

export default App
