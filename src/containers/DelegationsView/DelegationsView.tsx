import * as sdk from '@kiltprotocol/prototype-sdk'
import isEqual from 'lodash/isEqual'
import * as React from 'react'
import { connect } from 'react-redux'
import { Redirect, RouteComponentProps, withRouter } from 'react-router'

import { ViewType } from '../../components/DelegationNode/DelegationNode'
import DelegationDetailView from '../../components/DelegationDetailView/DelegationDetailView'
import SelectCTypesModal from '../../components/Modal/SelectCTypesModal'
import MyDelegationsInviteModal from '../../components/MyDelegationsInviteModal/MyDelegationsInviteModal'
import MyDelegationsListView from '../../components/MyDelegationsListView/MyDelegationsListView'
import { safeDelete } from '../../services/FeedbackService'
import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation } from '../../state/ducks/Delegations'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import { ICType } from '../../types/Ctype'

import './DelegationsView.scss'

type Props = RouteComponentProps<{ delegationId: string }> & {
  isPCR: boolean

  // mapStateToProps
  delegationEntries: MyDelegation[]
  selectedIdentity: MyIdentity
  // mapDispatchToProps
  removeDelegation: (delegation: MyDelegation) => void
}

type State = {
  delegationEntries: MyDelegation[]

  currentDelegation?: MyDelegation
  inviteDelegation?: MyDelegation
  invitePermissions?: sdk.Permission[]
  selectedContacts?: Contact[]
  redirect?: string
}

class DelegationsView extends React.Component<Props, State> {
  private selectCTypesModal: SelectCTypesModal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      delegationEntries: [],
    }

    this.deleteDelegation = this.deleteDelegation.bind(this)
    this.createDelegation = this.createDelegation.bind(this)
    this.onSelectCType = this.onSelectCType.bind(this)
    this.selectContact = this.selectContact.bind(this)
    this.requestInviteContact = this.requestInviteContact.bind(this)
    this.cancelInvite = this.cancelInvite.bind(this)
    this.confirmInvite = this.confirmInvite.bind(this)
  }

  public componentDidMount() {
    const { params, url } = this.props.match
    const { delegationId } = params
    const { delegationEntries, isPCR } = this.props

    this.filterDelegationEntries(delegationEntries, () => {
      if (delegationId) {
        const delegation = this.loadDelegationForId(delegationId)
        if (delegation) {
          if (!delegation.isPCR !== !isPCR) {
            const redirect = url.replace(
              /^\/.*\//,
              delegation.isPCR ? '/pcrs/' : '/delegations/'
            )
            this.setState({ redirect })
          } else {
            this.setState({
              currentDelegation: this.loadDelegationForId(delegationId),
            })
          }
        } else {
          this.setState({
            redirect: isPCR ? '/pcrs' : '/delegations',
          })
        }
      }
    })
  }

  public componentDidUpdate(prevProps: Props) {
    const { isPCR } = this.props
    if (
      prevProps.selectedIdentity.identity.address !==
      this.props.selectedIdentity.identity.address
    ) {
      this.setState({
        redirect: isPCR ? '/pcrs' : '/delegations',
      })
    }
    if (!isEqual(prevProps.delegationEntries, this.props.delegationEntries)) {
      this.filterDelegationEntries(this.props.delegationEntries)
    }
  }

  public render() {
    const { isPCR } = this.props
    const {
      delegationEntries,
      currentDelegation,
      inviteDelegation,
      redirect,
    } = this.state

    if (redirect) {
      return <Redirect to={redirect} />
    }

    return (
      <section className="DelegationsView">
        {!currentDelegation && (
          <MyDelegationsListView
            delegationEntries={delegationEntries}
            onRemoveDelegation={this.deleteDelegation}
            onCreateDelegation={this.createDelegation}
            onRequestInviteContacts={this.requestInviteContact}
            isPCR={isPCR}
          />
        )}
        {currentDelegation && (
          <DelegationDetailView
            id={currentDelegation.id}
            isPCR={isPCR}
            editable={true}
            viewType={ViewType.Present}
          />
        )}
        {inviteDelegation && (
          <MyDelegationsInviteModal
            delegationsSelected={[inviteDelegation]}
            onCancel={this.cancelInvite}
            onConfirm={this.confirmInvite}
            isPCR={isPCR}
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
    const { removeDelegation, isPCR } = this.props
    if (removeDelegation) {
      safeDelete(
        `${isPCR ? 'PCR' : 'delegation'} '${delegation.metaData.alias ||
          delegation.id}'`,
        () => {
          removeDelegation(delegation)
        }
      )
    }
  }

  private loadDelegationForId(
    delegationId: Delegations.MyDelegation['id']
  ): Delegations.MyDelegation | undefined {
    const { delegationEntries } = this.state

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
      const { isPCR } = this.props
      this.props.history.push(
        `/${isPCR ? 'pcrs' : 'delegations'}/new/${selectedCTypes[0].cType.hash}`
      )
    }
  }

  private filterDelegationEntries(
    allDelegationEntries: MyDelegation[],
    callback?: () => void
  ) {
    const { isPCR } = this.props

    // the ! check also checks older delegationEntries without isPCR
    const delegationEntries = allDelegationEntries.filter(
      (delegationEntry: MyDelegation) => !delegationEntry.isPCR === !isPCR
    )

    this.setState({ delegationEntries }, callback)
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
