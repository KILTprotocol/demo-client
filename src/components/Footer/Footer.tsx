import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { Link } from 'react-router-dom'

import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'

import './Footer.scss'

type StateProps = {
  debugMode: boolean
}

type Props = StateProps

type State = {}

class Footer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public render(): JSX.Element {
    const { debugMode } = this.props

    return (
      <section className="Footer">
        <Link to="/imprint">Imprint</Link>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms-of-use">Terms of Use</Link>
        {debugMode && <div className="debugModeLabel">Debug Mode</div>}
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  debugMode: UiState.getDebugMode(state),
})

export default connect(mapStateToProps)(Footer)
