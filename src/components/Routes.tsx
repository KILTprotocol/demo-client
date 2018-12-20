import * as React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import WalletComponent from './WalletView/WalletView'

import ChainStats from './ChainStats/ChainStats'
import ContactList from './ContactList/ContactList'
import CtypeCreate from './CtypeCreate/CtypeCreate'
import CtypeManager from './CtypeManager/CtypeManager'

import ClaimCreate from './ClaimCreate/ClaimCreate'
import ClaimList from './ClaimList/ClaimList'

import MessageList from './MessageList/MessageList'
import Root from './Root/Root'

const Routes: React.FunctionComponent<{}> = props => {
  // const bbqBirch = encodeURIComponent('wss://substrate-rpc.parity.io/')

  const nodeWebsocketUrl = getNodeWsAddress()

  function getNodeWsAddress() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${process.env.REACT_APP_NODE_HOST}:${
      process.env.REACT_APP_NODE_WS_PORT
    }`
  }

  return (
    <Switch>
      <Route path={'/wallet'} component={WalletComponent} />
      <Route path={'/chain-stats/:host'} component={ChainStats} />
      <Route
        path={'/chain-stats'}
        children={
          <Redirect
            to={`/chain-stats/${encodeURIComponent(nodeWebsocketUrl)}`}
          />
        }
      />
      <Route path={'/ctype/new'} component={CtypeCreate} />
      <Route path={'/ctype/:ctypeKey'} component={CtypeManager} />
      <Route path={'/ctype'} component={CtypeManager} />

      <Route path="/claim/new/:ctypeKey" component={ClaimCreate} />
      <Route path="/claim" component={ClaimList} />

      <Route path={'/contacts'} component={ContactList} />
      <Route path={'/messages'} component={MessageList} />
      <Route component={Root} />
    </Switch>
  )
}

export default Routes
