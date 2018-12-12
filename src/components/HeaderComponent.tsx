import * as React from 'react'
import { Link } from 'react-router-dom'
import { Dropdown, DropdownItemProps, Menu, Segment } from 'semantic-ui-react'
import logo from '../assets/kilt_negative.svg'
import './headerComponent.less'

const HeaderComponent: React.FunctionComponent = props => {
  const identities: DropdownItemProps[] = [
    { key: 1, text: 'This is a super long item', value: 1 },
    { key: 2, text: 'Dropdown direction can help', value: 2 },
    { key: 3, text: 'Items are kept within view', value: 3 },
  ]

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
            <Link to="/chain-stats">Chain stats</Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/contacts">Contacts</Link>
          </Menu.Item>
          <Menu.Menu position="right">
            <Link to="/" className="logo">
              <img src={logo} alt="logo" />
            </Link>
            <Dropdown
              item={true}
              simple={true}
              text="Right menu"
              direction="right"
              options={identities}
            />
          </Menu.Menu>
        </Menu>
        {/*<div>*/}
        {/*<Link to="/" className="logo">*/}
        {/*<img src={logo} alt="logo" />*/}
        {/*</Link>*/}
        {/*<Dropdown*/}
        {/*inline={true}*/}
        {/*options={identities}*/}
        {/*defaultValue={identities[0].value}*/}
        {/*direction="right"*/}
        {/*/>*/}
        {/*</div>*/}
      </Segment>
    </header>
  )
}

export default HeaderComponent
