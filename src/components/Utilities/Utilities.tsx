import * as React from 'react'
import { ChangeEvent } from 'react'
import { connect } from 'react-redux'

import * as UiState from '../../state/ducks/UiState'
import * as Balances from '../../state/ducks/Balances'
import * as Wallet from '../../state/ducks/Wallet'

import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import ChainStats from '../ChainStats/ChainStats'
import TestUserFeedback from '../TestUserFeedback/TestUserFeedback'
import DevTools from '../DevTools/DevTools'
import { clientVersionHelper } from '../../services/ClientVersionHelper'

import sdkPackage from '@kiltprotocol/sdk-js/package.json'
import clientPackage from '../../../package.json'
import { safeDestructiveAction } from '../../services/FeedbackService'
import { MyIdentity } from '../../types/Contact'

import './Utilities.scss'

type Props = {
  // mapStateToProps
  debugMode: boolean
  // mapDispatchToProps
  setDebugMode: (debugMode: boolean) => void
  // mapDispatchToProps
  selectedIdentity: MyIdentity
}

type State = {
  selectedIdentityBalance: number
}

class Utilities extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      selectedIdentityBalance: 0,
    }
    this.setDebugMode = this.setDebugMode.bind(this)
    this.resetClient = this.resetClient.bind(this)
  }

  public componentDidUpdate(prevProps: Props) {
    const { selectedIdentity } = this.props
    const { selectedIdentityBalance } = this.state

    const balance: number = selectedIdentity
      ? Balances.getBalance(
          PersistentStore.store.getState(),
          selectedIdentity.identity.address
        )
      : 0

    if (selectedIdentityBalance !== balance) {
      this.setState({
        selectedIdentityBalance: balance,
      })
    }
  }

  public render() {
    const { debugMode } = this.props
    return (
      <section className="Utilities">
        <h1>Utilities</h1>
        <section className="versions">
          <h2>Versions</h2>
          <div>
            <label>Client</label>
            <div>{clientPackage.version}</div>
          </div>
          <div>
            <label>SDK</label>
            <div>{sdkPackage.version}</div>
          </div>
          <div className="reset">
            <button onClick={this.resetClient}>Reset</button>
          </div>
        </section>
        <section className="debugMode">
          <h2>Set Debug Mode</h2>
          <div>
            <label>
              <input
                type="checkbox"
                checked={debugMode}
                onChange={this.setDebugMode}
              />
              <span>set app into debug mode</span>
            </label>
          </div>
        </section>
        <ChainStats />
        <TestUserFeedback />
        <DevTools />
      </section>
    )
  }

  private resetClient() {
    safeDestructiveAction(
      <div>
        Do you really want to reset the client to defaults?
        <div>You will lose all your local data!</div>
      </div>,
      () => {
        setTimeout(() => {
          clientVersionHelper.resetAndReloadClient()
        }, 500)
      }
    )
  }

  private setDebugMode(event: ChangeEvent<HTMLInputElement>) {
    const { setDebugMode } = this.props
    setDebugMode(event.target.checked)
  }
}

const mapStateToProps = (state: ReduxState) => ({
  debugMode: UiState.getDebugMode(state),
  selectedIdenty: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps = (dispatch: (action: UiState.Action) => void) => {
  return {
    setDebugMode: (debugMode: boolean) => {
      dispatch(UiState.Store.setDebugModeAction(debugMode))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Utilities)
