import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { Link } from 'react-router-dom'
import DidService from '../../services/DidService'
import FeedbackService, {
  notifySuccess,
  notifyError,
} from '../../services/FeedbackService'
import { IMyIdentity } from '../../types/Contact'
import Balance from '../../containers/Balance/Balance'

import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import IdentityView from '../IdentityView/IdentityView'

import './Dashboard.scss'

type StateProps = {
  selectedIdentity?: Wallet.Entry
}

type Props = StateProps

const Dashboard: React.FC<Props> = ({ selectedIdentity }) => {
  if (!selectedIdentity) {
    return null
  }

  const createDid = (myIdentity: IMyIdentity): void => {
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
      .catch((err) => {
        notifyError(err)
        blockUi.remove()
      })
  }

  return (
    <section className="Dashboard">
      <h1>
        <div>My Dashboard</div>
        <ContactPresentation
          address={selectedIdentity.identity.address}
          inline
        />
      </h1>
      <IdentityView
        myIdentity={selectedIdentity}
        selected
        onCreateDid={createDid}
      />
      <div className="actions">
        <Link to="/wallet">Manage Identities</Link>
      </div>
      <Balance myIdentity={selectedIdentity} />
    </section>
  )
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = (
  state
) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(Dashboard)
