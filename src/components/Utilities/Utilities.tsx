import * as React from 'react'
import { ChangeEvent } from 'react'
import { connect } from 'react-redux'

import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import ChainStats from '../ChainStats/ChainStats'
import TestUserFeedback from '../TestUserFeedback/TestUserFeedback'
import DevTools from '../DevTools/DevTools'

import sdkPackage from '@kiltprotocol/prototype-sdk/package.json'
import clientPackage from '../../../package.json'

import './Utilities.scss'

type Props = {
  // mapStateToProps
  debugMode: boolean
  // mapDispatchToProps
  setDebugMode: (debugMode: boolean) => void
}
type State = {}

class Utilities extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.setDebugMode = this.setDebugMode.bind(this)
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

  private setDebugMode(event: ChangeEvent<HTMLInputElement>) {
    const { setDebugMode } = this.props
    setDebugMode(event.target.checked)
  }
}

const mapStateToProps = (state: ReduxState) => ({
  debugMode: UiState.getDebugMode(state),
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
