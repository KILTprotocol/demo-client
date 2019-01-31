import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import IdentityView from '../../components/IdentityView/IdentityView'
import Modal, { ModalType } from '../../components/Modal/Modal'

import * as Wallet from '../../state/ducks/Wallet'
import { MyIdentity } from '../../types/Contact'

import './WalletView.scss'

type Props = RouteComponentProps<{}> & {
  selectIdentity: (address: MyIdentity['identity']['address']) => void
  removeIdentity: (address: MyIdentity['identity']['address']) => void
  identities: Wallet.Entry[]
  selectedIdentity?: Wallet.Entry
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

    const identities = this.props.identities.map((myIdentity: Wallet.Entry) => {
      let selected = false
      if (this.props.selectedIdentity) {
        selected =
          myIdentity.identity.address ===
          this.props.selectedIdentity.identity.address
      }
      return (
        <IdentityView
          key={myIdentity.identity.address}
          myIdentity={myIdentity}
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
            type={ModalType.CONFIRM}
          >
            <div>
              Are you sure you want to delete your identity '
              {identityToDelete.metaData.name}'?
            </div>
          </Modal>
        )}
      </section>
    )
  }

  private removeIdentity = () => {
    const { removeIdentity } = this.props
    const { identityToDelete } = this.state
    if (identityToDelete) {
      removeIdentity(identityToDelete.identity.address)
    }
  }

  private requestRemoveIdentity(address: MyIdentity['identity']['address']) {
    const { identities } = this.props
    const identityToDelete = identities.find(
      (identity: Wallet.Entry) => identity.identity.address === address
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

  private selectIdentity = (address: MyIdentity['identity']['address']) => {
    this.props.selectIdentity(address)
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    identities: state.wallet
      .get('identities')
      .toList()
      .toArray(),
    selectedIdentity: state.wallet.get('selectedIdentity'),
  }
}

const mapDispatchToProps = (dispatch: (action: Wallet.Action) => void) => {
  return {
    removeIdentity: (address: MyIdentity['identity']['address']) => {
      dispatch(Wallet.Store.removeIdentityAction(address))
    },
    selectIdentity: (address: MyIdentity['identity']['address']) => {
      dispatch(Wallet.Store.selectIdentityAction(address))
    },
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(WalletView)
)
