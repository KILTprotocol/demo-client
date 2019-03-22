import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'

import MyDelegationsInviteView from '../../components/MyDelegationsInviteModal/MyDelegationsInviteModal'
import MyDelegationsListView from '../../components/MyDelegationsListView/MyDelegationsListView'
import { safeDelete } from '../../services/FeedbackService'
import * as Delegations from '../../state/ducks/Delegations'
import { State as ReduxState } from '../../state/PersistentStore'
import SelectCTypesModal from '../../components/Modal/SelectCTypesModal'
import { ICType } from '../../types/Ctype'
import { Contact } from '../../types/Contact'

import './DelegationsView.scss'
import DelegationDetailView from 'src/components/DelegationDetailView/DelegationDetailView'

type Props = RouteComponentProps<{ delegationId: string }> & {
  delegationEntries: Delegations.Entry[]
  removeDelegation: (delegation: Delegations.Entry) => void
}

type State = {
  currentDelegation?: Delegations.MyDelegation
  inviteDelegation?: Delegations.Entry
  selectedContacts?: Contact[]
  invitePermissions?: sdk.Permission[]
}

class DelegationsView extends React.Component<Props, State> {
  private selectCTypesModal: SelectCTypesModal | null

  constructor(props: Props) {
    super(props)
    this.state = {}

    this.deleteDelegation = this.deleteDelegation.bind(this)
    this.createDelegation = this.createDelegation.bind(this)
    this.onSelectCType = this.onSelectCType.bind(this)
    this.selectContact = this.selectContact.bind(this)
    this.requestInviteContact = this.requestInviteContact.bind(this)
    this.cancelInvite = this.cancelInvite.bind(this)
    this.confirmInvite = this.confirmInvite.bind(this)
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
    const { delegationEntries } = this.props
    const { currentDelegation, inviteDelegation } = this.state
    return (
      <section className="DelegationsView">
        {!currentDelegation && (
          <MyDelegationsListView
            delegationEntries={delegationEntries}
            onRemoveDelegation={this.deleteDelegation}
            onCreateDelegation={this.createDelegation}
            onRequestInviteContacts={this.requestInviteContact}
          />
        )}
        {currentDelegation && (
          <DelegationDetailView id={currentDelegation.id} />
        )}
        {inviteDelegation && (
          <MyDelegationsInviteView
            delegationsSelected={[inviteDelegation]}
            onCancel={this.cancelInvite}
            onConfirm={this.confirmInvite}
          />
        )}
        <SelectCTypesModal
          ref={el => {
            this.selectCTypesModal = el
          }}
          placeholder="Select cType#{multi}…"
          onConfirm={this.onSelectCType}
        />
      </section>
    )
  }

  private requestInviteContact(inviteDelegation: Delegations.Entry) {
    this.setState({ inviteDelegation })
  }

  private selectContact(selectedContacts: Contact[]) {
    this.setState({ selectedContacts })
  }

  private cancelInvite() {
    this.setState({ inviteDelegation: undefined })
  }

  private confirmInvite() {
    this.setState({ inviteDelegation: undefined })
  }

  private deleteDelegation(delegation: Delegations.Entry) {
    const { removeDelegation } = this.props
    if (removeDelegation) {
      safeDelete(
        `delegation '${delegation.metaData.alias || delegation.id}'`,
        () => {
          removeDelegation(delegation)
        }
      )
    }
  }

  private loadDelegationForId(
    delegationId: Delegations.MyDelegation['id']
  ): Delegations.MyDelegation | undefined {
    const { delegationEntries } = this.props
    return delegationEntries.find(
      (delegationEntry: Delegations.Entry) =>
        delegationEntry.id === delegationId
    )
  }

  private createDelegation(): void {
    if (this.selectCTypesModal) {
      this.selectCTypesModal.show()
    }
  }

  private onSelectCType(selectedCTypes: ICType[]) {
    if (selectedCTypes && selectedCTypes.length === 1) {
      this.props.history.push(
        `/delegations/new/${selectedCTypes[0].cType.hash}`
      )
    }
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
