import * as React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import DelegationDetailView from '../../components/DelegationDetailView/DelegationDetailView'

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
            delegationId || '5Dk1WKyFyXwPbVGibxkZMKF6cRJS45R3qt9FeD13beajN5Vg'
          }
        />
      </section>
    )
  }
}

export default withRouter(DelegationView)
