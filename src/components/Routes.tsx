import * as React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import ChainStatsComponent from './chainStats/ChainStatsComponent'
import ContactListComponent from './contacts/ContactListComponent'
import CtypeManagerComponent from './ctype/CtypeManagerComponent'
import MessageListComponent from './messages/MessageListComponent'
import RootComponent from './root/RootComponent'
import WalletComponent from './wallet/WalletComponent'

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
      <Route path={'/chain-stats/:host'} component={ChainStatsComponent} />
      <Route
        path={'/chain-stats'}
        children={
          <Redirect
            to={`/chain-stats/${encodeURIComponent(nodeWebsocketUrl)}`}
          />
        }
      />
      <Route path={'/ctype/:ctypeKey'} component={CtypeManagerComponent} />
      <Route path={'/ctype'} component={CtypeManagerComponent} />
      <Route path={'/contacts'} component={ContactListComponent} />
      <Route
        path={'/messages/inbox/:pubKey'}
        component={MessageListComponent}
      />
      <Route component={RootComponent} />
    </Switch>
  )
}

export default Routes
