import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Balance from '../../containers/Balance/Balance'

import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import IdentityView from '../IdentityView/IdentityView'

import './Dashboard.scss'

type Props = {
  selectedIdentity: Wallet.Entry
}

type State = {}

class Dashboard extends React.Component<Props, State> {
  public render() {
    const { selectedIdentity } = this.props
    return (
      <section className="Dashboard">
        <h1>
          My Dashboard - <ContactPresentation myIdentity={selectedIdentity} />
        </h1>
        <IdentityView myIdentity={selectedIdentity} selected={true} />
        <div className="actions">
          <Link to={`/wallet`}>Manage Identities</Link>
        </div>
        <Balance />
      </section>
    )
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(Dashboard)
