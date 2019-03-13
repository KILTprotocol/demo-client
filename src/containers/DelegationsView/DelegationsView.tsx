import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import * as Delegations from '../../state/ducks/Delegations'
import { State as ReduxState } from '../../state/PersistentStore'
import MyDelegationsListView from '../../components/MyDelegationsListView/MyDelegationsListView'

import './DelegationsView.scss'

type Props = RouteComponentProps<{ delegationId: string }> & {
  delegationEntries: Delegations.Entry[]
  removeDelegation: (delegation: Delegations.Entry) => void
}

type State = {
  currentDelegation?: Delegations.MyDelegation
}

class DelegationsView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.deleteDelegation = this.deleteDelegation.bind(this)
  }

  public componentDidMount() {
    const { delegationId } = this.props.match.params
    if (delegationId) {
      this.setState({
        currentDelegation: this.loadDelegationForId(delegationId),
      })
    }
  }

  public render() {
    const { currentDelegation } = this.state
    const { delegationEntries } = this.props
    return (
      <section className="DelegationsView">
        {!currentDelegation && (
          <MyDelegationsListView
            delegationEntries={delegationEntries}
            onRemoveDelegation={this.deleteDelegation}
          />
        )}
      </section>
    )
  }

  private deleteDelegation(delegation: Delegations.Entry) {
    const { removeDelegation } = this.props
    if (removeDelegation) {
      removeDelegation(delegation)
    }
  }

  private loadDelegationForId(
    delegationId: Delegations.MyDelegation['id']
  ): Delegations.MyDelegation | undefined {
    const { delegationEntries } = this.props
    return delegationEntries.find((delegationEntry: Delegations.Entry) => delegationEntry.id === delegationId)
  }
}

const mapStateToProps = (state: ReduxState) => ({
  delegationEntries: Delegations.getDelegations(state),
})

const mapDispatchToProps = (dispatch: (action: Delegations.Action) => void) => {
  return {
    removeDelegation: (delegation: Delegations.Entry) => {
      dispatch(Delegations.Store.removeDelegationAction(delegation))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(DelegationsView))
