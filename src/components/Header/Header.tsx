import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { Link } from 'react-router-dom'

import logo from '../../assets/kilt_negative.svg'
import IdentitySelectorComponent from '../../containers/IdentitySelector/IdentitySelector'
import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import Navigation from '../Navigation/Navigation'
import './Header.scss'

type StateProps = {
  debugMode: boolean
}

type Props = StateProps

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

  private toggleNavigation = (): void => {
    const { openNavigation } = this.state
    this.setState({
      openNavigation: !openNavigation,
    })
  }

  private closeNavigation = (): void => {
    this.setState({
      openNavigation: false,
    })
  }

  // private openNavigation = () => {
  //   this.setState({
  //     openNavigation: true
  //   })
  // }

  public render(): JSX.Element {
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
            <button
              type="button"
              className="menu"
              onClick={this.toggleNavigation}
            />
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
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = (
  state
) => ({
  debugMode: UiState.getDebugMode(state),
})

export default connect(mapStateToProps)(Header)
