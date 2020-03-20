import React from 'react'
import { connect, MapStateToProps, MapDispatchToProps } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import IdentityView from '../../components/IdentityView/IdentityView'
import FeedbackService, {
  safeDelete,
  notifySuccess,
  notifyError,
} from '../../services/FeedbackService'

import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { IMyIdentity } from '../../types/Contact'

import './WalletView.scss'
import DidService from '../../services/DidService'

type StateProps = {
  identities: Wallet.Entry[]
  selectedIdentity?: Wallet.Entry
}

type DispatchProps = {
  selectIdentity: (address: IMyIdentity['identity']['address']) => void
  removeIdentity: (address: IMyIdentity['identity']['address']) => void
}

type Props = RouteComponentProps<{}> & StateProps & DispatchProps

class WalletView extends React.Component<Props> {
  private static createDid(myIdentity: IMyIdentity): void {
    const blockUi = FeedbackService.addBlockUi({
      headline: `Generating DID for '${myIdentity.metaData.name}'`,
    })
    DidService.createDid(myIdentity) // TODO: add document reference
      .then(() => {
        notifySuccess(
          `DID for '${myIdentity.metaData.name}' successfully generated`
        )
        blockUi.remove()
      })
      .catch(err => {
        notifyError(err)
        blockUi.remove()
      })
  }

  private static deleteDid(myIdentity: IMyIdentity): void {
    safeDelete(`the DID for '${myIdentity.metaData.name}'`, () => {
      const blockUi = FeedbackService.addBlockUi({
        headline: `Removing DID for '${myIdentity.metaData.name}'`,
      })
      DidService.deleteDid(myIdentity)
        .then(() => {
          notifySuccess(
            `Successfully deleted DID for '${myIdentity.metaData.name}'`
          )
          blockUi.remove()
        })
        .catch(err => {
          notifyError(err)
          blockUi.remove()
        })
    })
  }

  constructor(props: Props) {
    super(props)

    this.removeIdentity = this.removeIdentity.bind(this)
  }

  private selectIdentity = (
    address: IMyIdentity['identity']['address']
  ): void => {
    const { selectIdentity } = this.props
    selectIdentity(address)
  }

  private removeIdentity(address: IMyIdentity['identity']['address']): void {
    const { identities, removeIdentity } = this.props
    const identityToDelete = identities.find(
      (identity: Wallet.Entry) => identity.identity.address === address
    )

    if (identityToDelete) {
      safeDelete(`your identity '${identityToDelete.metaData.name}''`, () => {
        removeIdentity(identityToDelete.identity.address)
      })
    }
  }

  public render(): JSX.Element {
    const { identities, selectedIdentity } = this.props
    const renderedIdentities = identities.map((myIdentity: Wallet.Entry) => {
      let selected = false
      if (selectedIdentity) {
        selected =
          myIdentity.identity.address === selectedIdentity.identity.address
      }
      return (
        <IdentityView
          key={myIdentity.identity.address}
          myIdentity={myIdentity}
          selected={selected}
          onDelete={this.removeIdentity}
          onSelect={this.selectIdentity}
          onCreateDid={WalletView.createDid}
          onDeleteDid={WalletView.deleteDid}
        />
      )
    })

    return (
      <section className="WalletView">
        <h1>Wallet / My Identities</h1>
        <div>{renderedIdentities}</div>
        <div className="actions">
          <Link to="/wallet/add" className="add">
            Add Identity
          </Link>
        </div>
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  identities: Wallet.getAllIdentities(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps: MapDispatchToProps<DispatchProps, {}> = dispatch => {
  return {
    removeIdentity: (address: IMyIdentity['identity']['address']) => {
      dispatch(Wallet.Store.removeIdentityAction(address))
    },
    selectIdentity: (address: IMyIdentity['identity']['address']) => {
      dispatch(Wallet.Store.selectIdentityAction(address))
    },
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(WalletView)
)
