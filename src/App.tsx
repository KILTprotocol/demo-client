import * as React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

import './App.css'
import HeaderComponent from './components/header/HeaderComponent'
import Routes from './components/Routes'
import './semantic/dist/semantic.min.css'

class App extends React.Component {
  public render() {
    return (
      <Router>
        <div className="App">
          <HeaderComponent />
          <Routes />
        </div>
      </Router>
    )
  }
}

export default App
