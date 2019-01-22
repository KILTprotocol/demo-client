import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import IdentityView from '../../components/IdentityView/IdentityView'
import Modal from '../../components/Modal/Modal'

import * as Wallet from '../../state/ducks/Wallet'

import './WalletView.scss'

type Props = RouteComponentProps<{}> & {
  selectIdentity: (seedAsHex: string) => void
  removeIdentity: (seedAsHex: string) => void
  identities: Wallet.Entry[]
  selected?: Wallet.Entry
}

type State = {
  identityToDelete?: Wallet.Entry
}

class WalletView extends React.Component<Props, State> {
  private deleteModal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {}

    this.requestRemoveIdentity = this.requestRemoveIdentity.bind(this)
  }

  public render() {
    const { identityToDelete } = this.state

    const identities = this.props.identities.map((entry: Wallet.Entry) => {
      let selected = false
      if (this.props.selected) {
        selected =
          entry.identity.seedAsHex === this.props.selected.identity.seedAsHex
      }
      return (
        <IdentityView
          key={entry.identity.seedAsHex}
          identity={entry.identity}
          alias={entry.alias}
          selected={selected}
          onDelete={this.requestRemoveIdentity}
          onSelect={this.selectIdentity}
        />
      )
    })

    return (
      <section className="WalletView">
        <h1>Wallet / My Identities</h1>
        <div>{identities}</div>
        <div className="actions">
          <Link to="/wallet/add" className="add">
            Add Identity
          </Link>
        </div>
        {!!identityToDelete && (
          <Modal
            ref={el => {
              this.deleteModal = el
            }}
            header="Delete?"
            onConfirm={this.removeIdentity}
            type="confirm"
          >
            <div>
              Are you sure you want to delete your identity '
              {identityToDelete.alias}'?
            </div>
          </Modal>
        )}
      </section>
    )
  }

  private removeIdentity = () => {
    const { identityToDelete } = this.state
    if (identityToDelete) {
      this.props.removeIdentity(identityToDelete.identity.seedAsHex)
    }
  }

  private requestRemoveIdentity(seedAsHex: string) {
    const { identities } = this.props
    const identityToDelete = identities.find(
      (identity: Wallet.Entry) => identity.identity.seedAsHex === seedAsHex
    )

    if (identityToDelete) {
      this.setState({ identityToDelete }, () => {
        if (this.deleteModal) {
          this.deleteModal.show()
        }
      })
    } else {
      this.setState({ identityToDelete: undefined })
    }
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
