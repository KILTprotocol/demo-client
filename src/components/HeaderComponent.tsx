import * as React from 'react'
import { Link } from "react-router-dom"
import logo from '../logo.png'

const HeaderComponent: React.SFC<{}> = props => {
  return (
    <header className="App-header">
      <Link to='/'>
        <img src={logo} className="App-logo" alt="logo" />
      </Link>
      <br />
      <Link to='/ctype'>CTYPE manager</Link>
    </header>
  )
}


export default HeaderComponent