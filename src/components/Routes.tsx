import * as React from 'react'
import { Route, Switch } from "react-router-dom"
import CtypeComponent from './ctype/CtypeComponent'
import RootComponent from './root/RootComponent'


const Routes: React.SFC<{}> = props => {
  return (
    <Switch>
      <Route path={"/ctype/:hash"} component={CtypeComponent} />
      <Route path="/ctype" component={CtypeComponent} />
      <Route component={RootComponent} />
    </Switch>
  )
}

export default Routes