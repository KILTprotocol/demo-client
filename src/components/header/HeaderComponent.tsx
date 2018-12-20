import * as React from 'react'
import { Link } from 'react-router-dom'
import { Menu, Segment } from 'semantic-ui-react'
import logo from '../../assets/kilt_negative.svg'
import './headerComponent.less'
import IdentitySelectorComponent from './IdentitySelectorComponent'

const HeaderComponent: React.FunctionComponent = props => {
  return (
    <header className="kilt-header">
      <Segment inverted={true} basic={true} className="header-segment">
        <Menu inverted={true} secondary={true}>
          <Menu.Item>
            <Link to="/wallet">Wallet</Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/ctype">CTYPE manager</Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/claim">Claims</Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/chain-stats">Chain stats</Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/contacts">Contacts</Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/messages">Messages</Link>
          </Menu.Item>
          <Menu.Menu position="right">
            <Link to="/" className="logo">
              <img src={logo} alt="logo" />
            </Link>
            <IdentitySelectorComponent />
          </Menu.Menu>
        </Menu>
      </Segment>
    </header>
  )
}

export default HeaderComponent
