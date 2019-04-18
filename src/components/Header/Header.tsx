import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import logo from '../../assets/kilt_negative.svg'
import IdentitySelectorComponent from '../../containers/IdentitySelector/IdentitySelector'
import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import Navigation from '../Navigation/Navigation'
import './Header.scss'

type Props = {
  debugMode: boolean
}

type State = {
  openNavigation: boolean
}

class Header extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      openNavigation: false,
    }
  }

  public render() {
    const { debugMode } = this.props
    const { openNavigation } = this.state

    const classes = [
      'Header',
      openNavigation ? 'open-navigation' : 'close-navigation',
    ]

    return (
      <>
        <header className={classes.join(' ')}>
          <section>
            <button className="menu" onClick={this.toggleNavigation} />
            <div
              className="navigation-container"
              onClick={this.closeNavigation}
            >
              <Navigation selectRoute={this.closeNavigation} />
            </div>
            <div className="logo-id">
              <Link to="/" className="logo">
                <img src={logo} alt="logo" />
              </Link>
              <IdentitySelectorComponent />
            </div>
          </section>
        </header>
        {debugMode && <div className="debugModeLabel">Debug Mode</div>}
      </>
    )
  }

  private toggleNavigation = () => {
    this.setState({
      openNavigation: !this.state.openNavigation,
    })
  }

  private closeNavigation = () => {
    this.setState({
      openNavigation: false,
    })
  }

  // private openNavigation = () => {
  //   this.setState({
  //     openNavigation: true
  //   })
  // }
}

const mapStateToProps = (state: ReduxState) => ({
  debugMode: UiState.getDebugMode(state),
})

export default connect(mapStateToProps)(Header)
