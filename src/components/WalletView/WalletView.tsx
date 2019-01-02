import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'

import * as Wallet from '../../state/ducks/Wallet'
import IdentityViewComponent from '../IdentityView/IdentityView'
import './WalletView.scss'

type Props = RouteComponentProps<{}> & {
  selectIdentity: (seedAsHex: string) => void
  removeIdentity: (seedAsHex: string) => void
  identities: Wallet.Entry[]
  selected?: Wallet.Entry
}

type State = {}

class WalletView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const identities = this.props.identities.map((entry: Wallet.Entry) => {
      let selected = false
      if (this.props.selected) {
        selected =
          entry.identity.seedAsHex === this.props.selected.identity.seedAsHex
      }
      return (
        <IdentityViewComponent
          key={entry.identity.seedAsHex}
          identity={entry.identity}
          alias={entry.alias}
          selected={selected}
          onDelete={this.removeIdentity}
          onSelect={this.selectIdentity}
        />
      )
    })

    const actions = (
      <div className="actions">
        <Link to="/wallet/add">
          <button type="button">Add Identity</button>
        </Link>
      </div>
    )

    return (
      <section className="WalletView">
        <h1>Wallet / My Identities</h1>
        {actions}
        <table>{identities}</table>
        {actions}
      </section>
    )
  }

  private removeIdentity = (seedAsHex: string) => {
    this.props.removeIdentity(seedAsHex)
  }

  private selectIdentity = (seedAsHex: string) => {
    this.props.selectIdentity(seedAsHex)
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    identities: state.wallet
      .get('identities')
      .toList()
      .toArray(),
    selected: state.wallet.get('selected'),
  }
}

const mapDispatchToProps = (dispatch: (action: Wallet.Action) => void) => {
  return {
    removeIdentity: (seedAsHex: string) => {
      dispatch(Wallet.Store.removeIdentityAction(seedAsHex))
    },
    selectIdentity: (seedAsHex: string) => {
      dispatch(Wallet.Store.selectIdentityAction(seedAsHex))
    },
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(WalletView)
)
