import * as React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import * as Wallet from '../../state/ducks/Wallet'
import DelegationDetailView from '../../components/DelegationDetailView/DelegationDetailView'
import PersistentStore from '../../state/PersistentStore'

type Props = RouteComponentProps<{ delegationId: string }> & {}

type State = {}

class DelegationView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { delegationId } = this.props.match.params

    return (
      <section className="DelegationView">
        <DelegationDetailView
          id={
            delegationId ||
            Wallet.getSelectedIdentity(PersistentStore.store.getState())
              .identity.address
          }
        />
      </section>
    )
  }
}

export default withRouter(DelegationView)
