import * as React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import ChainStats from '../smart_containers/ChainStats/ChainStats'
import ClaimCreate from '../smart_containers/ClaimCreate/ClaimCreate'
import ClaimList from '../smart_containers/ClaimList/ClaimList'
import ContactList from '../smart_containers/ContactList/ContactList'
import CtypeCreate from '../smart_containers/CtypeCreate/CtypeCreate'
import CtypeManager from '../smart_containers/CtypeManager/CtypeManager'
import MessageList from '../smart_containers/MessageList/MessageList'
import WalletAdd from '../smart_containers/WalletAdd/WalletAdd'
import WalletView from '../smart_containers/WalletView/WalletView'
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
      <Route path={'/wallet/add'} component={WalletAdd} />
      <Route path={'/wallet'} component={WalletView} />
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
