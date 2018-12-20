import * as React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

import './App.scss'
import Header from './components/_Header/Header'
import Routes from './components/Routes'

class App extends React.Component {
  public render() {
    return (
      <Router>
        <div className="App">
          <Header />
          <Routes />
        </div>
      </Router>
    )
  }
}

export default App
