import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'

import MyDelegationsInviteModal from '../../components/MyDelegationsInviteModal/MyDelegationsInviteModal'
import MyDelegationsListView from '../../components/MyDelegationsListView/MyDelegationsListView'
import { safeDelete } from '../../services/FeedbackService'
import { MyDelegation } from '../../state/ducks/Delegations'
import * as Delegations from '../../state/ducks/Delegations'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import SelectCTypesModal from '../../components/Modal/SelectCTypesModal'
import { ICType } from '../../types/Ctype'
import { Contact, MyIdentity } from '../../types/Contact'

import './DelegationsView.scss'
import DelegationDetailView from 'src/components/DelegationDetailView/DelegationDetailView'

type Props = RouteComponentProps<{ delegationId: string }> & {
  removeDelegation: (delegation: MyDelegation) => void

  delegationEntries: MyDelegation[]
  selectedIdentity: MyIdentity
}

type State = {
  currentDelegation?: MyDelegation
  inviteDelegation?: MyDelegation
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
    const { delegationEntries, selectedIdentity } = this.props
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
          <DelegationDetailView
            id={currentDelegation.id}
            selectedIdentity={selectedIdentity}
          />
        )}
        {inviteDelegation && (
          <MyDelegationsInviteModal
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

  private requestInviteContact(inviteDelegation: MyDelegation) {
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

  private deleteDelegation(delegation: MyDelegation) {
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
      (delegationEntry: MyDelegation) => delegationEntry.id === delegationId
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
  delegationEntries: Delegations.getAllDelegations(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps = (dispatch: (action: Delegations.Action) => void) => {
  return {
    removeDelegation: (delegation: MyDelegation) => {
      dispatch(Delegations.Store.removeDelegationAction(delegation))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(DelegationsView))
