import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { Link } from 'react-router-dom'
import Balance from '../../containers/Balance/Balance'

import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import IdentityView from '../IdentityView/IdentityView'

import './Dashboard.scss'

type StateProps = {
  selectedIdentity: Wallet.Entry
}

type Props = StateProps

const Dashboard: React.FC<Props> = ({ selectedIdentity }): JSX.Element => (
  <section className="Dashboard">
    <h1>
      <div>My Dashboard</div>
      <ContactPresentation
        address={selectedIdentity.identity.getAddress()}
        inline
      />
    </h1>
    <IdentityView myIdentity={selectedIdentity} selected />
    <div className="actions">
      <Link to="/wallet">Manage Identities</Link>
    </div>
    <Balance myIdentity={selectedIdentity} />
  </section>
)

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(Dashboard)
