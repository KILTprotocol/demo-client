import * as React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import ChainStatsComponent from './chainStats/ChainStatsComponent'
import CtypeComponent from './ctype/CtypeComponent'
import RootComponent from './root/RootComponent'

const Routes: React.FunctionComponent<{}> = props => {
  const defaultLocalhost = encodeURIComponent('ws://127.0.0.1:9944')
  // const bbqBirch = encodeURIComponent('wss://substrate-rpc.parity.io/')

  return (
    <Switch>
      <Route path={'/chain-stats/:host'} component={ChainStatsComponent} />
      <Route
        path={'/chain-stats'}
        children={<Redirect to={`/chain-stats/${defaultLocalhost}`} />}
      />
      <Route path={'/ctype/:hash'} component={CtypeComponent} />
      <Route path={'/ctype'} component={CtypeComponent} />
      <Route component={RootComponent} />
    </Switch>
  )
}

export default Routes
