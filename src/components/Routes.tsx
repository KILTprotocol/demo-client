import * as React from 'react'
import { Redirect, Route, Switch } from "react-router-dom"
import ChainStatsComponent from './chainStats/ChainStatsComponent'
import CtypeComponent from './ctype/CtypeComponent'
import RootComponent from './root/RootComponent'


const Routes: React.SFC<{}> = props => {
  return (
    <Switch>
      <Route path={"/chain-stats/:ip"} component={ChainStatsComponent} />
      <Route path={"/chain-stats"} children={<Redirect to='/chain-stats/127.0.0.1' />} />
      <Route path={"/ctype/:hash"} component={CtypeComponent} />
      <Route path={"/ctype"} component={CtypeComponent} />
      <Route component={RootComponent} />
    </Switch>
  )
}

export default Routes