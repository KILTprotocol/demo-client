import * as React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import WalletComponent from './wallet/WalletComponent'

import ChainStatsComponent from './chainStats/ChainStatsComponent'
import CtypeManagerComponent from './ctype/CtypeManagerComponent'

import ClaimCreate from './claim/ClaimCreate'

import RootComponent from './root/RootComponent'

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

      <Route path="/claim/new/:ctypeKey" component={ClaimCreate} />

      <Route component={RootComponent} />
    </Switch>
  )
}

export default Routes
