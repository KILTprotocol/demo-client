import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import Code from '../../components/Code/Code'

import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { MyIdentity, Contact } from '../../types/Contact'

import './DidView.scss'
import ContactRepository from '../../services/ContactRepository'

type Props = RouteComponentProps<{}> & {
  selectedIdentity: Wallet.Entry
}

type State = {
  contact?: Contact
  did?: Contact['did'] | null
}

class DidView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    const identity = this.props.selectedIdentity
    ContactRepository.findByAddress(identity.identity.address).then(
      (contact: Contact) => {
        this.setState({ did: contact.did })
      }
    )
  }

  public render() {
    const identity = this.props.selectedIdentity
    const did = this.state.did
    return (
      <section className="DidView">
        <h1>DID DOCUMENT</h1>
        {did ? (
          <React.Fragment>
            <div className="attributes">
              <div>
                <label>Title</label>
                <div>{identity.metaData.name}</div>
              </div>
              <div>
                <label>DID Document</label>
                <div>
                  <Code>{did}</Code>
                </div>
              </div>
            </div>
            <div className="actions">
              <Link to="/dashboard">Cancel</Link>
            </div>
          </React.Fragment>
        ) : (
          <div>Given Identity doesn't have a DID.</div>
        )}
      </section>
    )
  }
}

const mapStateToProps = (state: ReduxState) => ({
  identities: Wallet.getAllIdentities(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

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
  )(DidView)
)
