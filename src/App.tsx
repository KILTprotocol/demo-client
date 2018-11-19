import * as React from 'react'
import './App.css'

import logo from './logo.png'

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to KILT Prototype Client</h1>
        </header>
      </div>
    )
  }
}

export default App