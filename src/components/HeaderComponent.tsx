import * as React from 'react'
import { Link } from "react-router-dom"
import logo from '../assets/logo.png'

const HeaderComponent: React.FunctionComponent = (props) => {
  return (
    <header>
      <Link to='/'>
        <img src={logo} alt="logo" />
      </Link>
      <br />
      <Link to='/ctype'>CTYPE manager </Link>
      <Link to='/chain-stats'>Chain stats </Link>
    </header>
  )
}

export default HeaderComponent