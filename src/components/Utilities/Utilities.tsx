import React, { ChangeEvent } from 'react'
import { connect, MapStateToProps, MapDispatchToProps } from 'react-redux'
import sdkPackage from '@kiltprotocol/sdk-js/package.json'

import * as UiState from '../../state/ducks/UiState'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import ChainStats from '../ChainStats/ChainStats'
import TestUserFeedback from '../TestUserFeedback/TestUserFeedback'
import DevTools from '../DevTools/DevTools'
import ClientVersionHelper from '../../services/ClientVersionHelper'
import { safeDestructiveAction } from '../../services/FeedbackService'
import { IMyIdentity } from '../../types/Contact'
import './Utilities.scss'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const clientPackage = require('../../../package.json')

type StateProps = {
  debugMode: boolean
  selectedIdentity: IMyIdentity
}

type DispatchProps = {
  setDebugMode: (debugMode: boolean) => void
}

type Props = StateProps & DispatchProps

class Utilities extends React.Component<Props> {
  private static resetClient(): void {
    safeDestructiveAction(
      <div>
        Do you really want to reset the client to defaults?
        <div>You will lose all your local data!</div>
      </div>,
      () => {
        window.setTimeout(() => {
          ClientVersionHelper.resetAndReloadClient()
        }, 500)
      }
    )
  }

  constructor(props: Props) {
    super(props)
    this.setDebugMode = this.setDebugMode.bind(this)
  }

  private setDebugMode(event: ChangeEvent<HTMLInputElement>): void {
    const { setDebugMode } = this.props
    setDebugMode(event.target.checked)
  }

  public render(): JSX.Element {
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
            <button type="button" onClick={Utilities.resetClient}>
              Reset
            </button>
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
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  debugMode: UiState.getDebugMode(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps: MapDispatchToProps<DispatchProps, {}> = dispatch => {
  return {
    setDebugMode: (debugMode: boolean) => {
      dispatch(UiState.Store.setDebugModeAction(debugMode))
    },
  }
}

export default connect<StateProps, DispatchProps, {}, ReduxState>(
  mapStateToProps,
  mapDispatchToProps
)(Utilities)
