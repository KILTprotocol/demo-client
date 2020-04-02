import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

import './App.scss'
import Footer from './components/Footer/Footer'
import Header from './components/Header/Header'
import BlockingNotifications from './containers/BlockingNotifications/BlockingNotifications'
import BlockUi from './containers/BlockUi/BlockUi'
import Notifications from './containers/Notifications/Notifications'
import Tasks from './containers/Tasks/Tasks'
import Routes from './routes'
import './utils/Polyfills'

const App = (): JSX.Element => (
  <Router>
    <div className="App">
      <Header />
      <Routes />
      <BlockUi />
      <BlockingNotifications />
      <Notifications />
      <Tasks />
      <Footer />
    </div>
  </Router>
)

export default App
