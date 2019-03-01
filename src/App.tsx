import * as React from 'react'
import { connect } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'

import './App.scss'
import Header from './components/Header/Header'
import BlockingNotifications from './containers/BlockingNotifications/BlockingNotifications'
import BlockUi from './containers/BlockUi/BlockUi'
import Notifications from './containers/Notifications/Notifications'
import Routes from './routes'
import BalanceUtilities from './services/BalanceUtilities'
import * as Wallet from './state/ducks/Wallet'
import { State as ReduxState } from './state/PersistentStore'
import { MyIdentity } from './types/Contact'

type Props = {
  myIdentities: MyIdentity[]
}

type State = {}

class App extends React.Component<Props, State> {
  public componentDidMount() {
    this.connect()
  }

  public componentDidUpdate() {
    this.connect()
  }

  public shouldComponentUpdate(nextProps: Props) {
    return nextProps.myIdentities.length !== this.props.myIdentities.length
  }

  public render() {
    return (
      <Router>
        <div className="App">
          <Header />
          <Routes />
          <BlockUi />
          <BlockingNotifications />
          <Notifications />
        </div>
      </Router>
    )
  }

  private connect() {
    const { myIdentities } = this.props
    if (myIdentities && myIdentities.length) {
      myIdentities.forEach((myIdentity: MyIdentity) => {
        BalanceUtilities.connect(myIdentity)
      })
    }
  }
}

const mapStateToProps = (state: ReduxState) => {
  return {
    myIdentities: Wallet.getAllIdentities(state),
  }
}

export default connect(mapStateToProps)(App)
