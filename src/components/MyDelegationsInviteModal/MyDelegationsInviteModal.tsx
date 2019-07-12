import * as sdk from '@kiltprotocol/sdk-js'
import * as React from 'react'
import { connect } from 'react-redux'
import MessageRepository from '../../services/MessageRepository'
import * as Contacts from '../../state/ducks/Contacts'
import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation } from '../../state/ducks/Delegations'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import Modal, { ModalType } from '../Modal/Modal'
import SelectContacts from '../SelectContacts/SelectContacts'
import SelectDelegations from '../SelectDelegations/SelectDelegations'
import SelectPermissions from '../SelectPermissions/SelectPermissions'

import './MyDelegationsInviteModal.scss'

type Props = {
  delegationsSelected?: MyDelegation[]
  myDelegations: MyDelegation[]
  selectedIdentity: MyIdentity
  isPCR: boolean

  contactsPool?: Contact[]
  contactsSelected?: Contact[]
  delegationsPool?: MyDelegation[]

  onCancel?: () => void
  onConfirm?: () => void
}

type State = {
  contacts: {
    isSelectOpen: boolean
    selected: Contact[]

    pool?: Contact[]
  }
  delegations: {
    isSelectOpen: boolean
    selected: MyDelegation[]

    pool?: MyDelegation[]
  }
  permissions: sdk.Permission[]
}

class MyDelegationsInviteModal extends React.Component<Props, State> {
  public static defaultProps: Partial<Props> = {}

  private modal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      contacts: {
        isSelectOpen: false,
        selected: props.contactsSelected || [],
      },
      delegations: {
        isSelectOpen: false,
        selected: props.delegationsSelected || [],
      },
      permissions: props.isPCR ? [1] : [],
    }

    this.cancel = this.cancel.bind(this)
    this.confirm = this.confirm.bind(this)

    this.changePermissions = this.changePermissions.bind(this)

    this.changeContacts = this.changeContacts.bind(this)
    this.setSelectContactsOpen = this.setSelectContactsOpen.bind(this)

    this.filterDelegations = this.filterDelegations.bind(this)
    this.changeDelegations = this.changeDelegations.bind(this)
    this.setSelectDelegationsOpen = this.setSelectDelegationsOpen.bind(this)
  }

  public componentDidMount() {
    const { contactsPool, delegationsPool, myDelegations }: Props = this.props

    this.createPools(
      contactsPool || Contacts.getMyContacts(PersistentStore.store.getState()),
      delegationsPool || myDelegations
    )
  }

  public render() {
    return (
      <section className="MyDelegationsInviteModal">
        {this.getModalElement()}
      </section>
    )
  }

  public show() {
    if (this.modal) {
      this.modal.show()
    }
  }

  public hide() {
    if (this.modal) {
      this.modal.hide()
    }
  }

  private getModalElement() {
    const { contactsSelected, delegationsSelected, isPCR } = this.props
    const { contacts, delegations, permissions } = this.state

    const selectables = isPCR ? [] : ['permissions']
    if (!contactsSelected) {
      selectables.push('contact(s)')
    }
    if (!delegationsSelected) {
      selectables.push(isPCR ? 'PCR(s)' : 'delegation(s)')
    }

    return (
      <Modal
        ref={el => {
          this.modal = el
        }}
        catchBackdropClick={contacts.isSelectOpen || delegations.isSelectOpen}
        className="small"
        header={`Please select ${selectables.join(', ')}`}
        preventCloseOnCancel={true}
        preventCloseOnConfirm={true}
        type={ModalType.BLANK}
        showOnInit={true}
      >
        {!isPCR && (
          <SelectPermissions
            permissions={permissions}
            onChange={this.changePermissions}
          />
        )}

        <div className="contactsSelect">
          {contactsSelected && <h2>Selected contact(s)</h2>}
          {!contactsSelected && <h2>Select contact(s)</h2>}
          {contacts.pool && (
            <SelectContacts
              contacts={contacts.pool}
              name="selectContactsForInvite"
              preSelectedAddresses={(contactsSelected || []).map(
                (contact: Contact) => contact.publicIdentity.address
              )}
              isMulti={true}
              closeMenuOnSelect={true}
              onChange={this.changeContacts}
              onMenuOpen={this.setSelectContactsOpen.bind(this, true)}
              onMenuClose={this.setSelectContactsOpen.bind(this, false, 500)}
            />
          )}
        </div>

        <div className="delegationsSelect">
          {delegationsSelected && (
            <h2>Selected {isPCR ? 'PCR' : 'delegation'}(s)</h2>
          )}
          {!delegationsSelected && (
            <h2>Select {isPCR ? 'PCR' : 'delegation'}(s)</h2>
          )}
          {delegations.pool && (
            <SelectDelegations
              delegations={delegations.pool}
              name="selectDelegationsForInvite"
              defaultValues={delegationsSelected}
              isMulti={true}
              closeMenuOnSelect={true}
              placeholder={isPCR ? `Select PCRs…` : undefined}
              filter={this.filterDelegations}
              onChange={this.changeDelegations}
              onMenuOpen={this.setSelectDelegationsOpen.bind(this, true)}
              onMenuClose={this.setSelectDelegationsOpen.bind(this, false, 500)}
            />
          )}
        </div>

        <footer>
          <button className="cancel" onClick={this.cancel}>
            Cancel
          </button>
          <button
            className="invite"
            disabled={!this.isInvitationValid()}
            onClick={this.confirm}
          >
            Invite
          </button>
        </footer>
      </Modal>
    )
  }

  private filterDelegations(delegation: MyDelegation): boolean {
    const { isPCR } = this.props

    // check PCR
    if (isPCR != null && !delegation.isPCR !== !isPCR) {
      return false
    }

    // check revoked
    if (delegation.revoked) {
      return false
    }

    // check permissions
    return !(
      delegation.permissions &&
      delegation.permissions.indexOf(sdk.Permission.DELEGATE) === -1
    )
  }

  private changePermissions(newPermissions: sdk.Permission[]) {
    this.setState({ permissions: newPermissions })
  }

  private changeContacts(selected: Contact[]) {
    const { contacts } = this.state
    this.setState({ contacts: { ...contacts, selected } })
  }

  private setSelectContactsOpen(isSelectOpen: boolean, delay?: number) {
    setTimeout(() => {
      const { contacts } = this.state
      this.setState({ contacts: { ...contacts, isSelectOpen } })
    }, delay)
  }

  private changeDelegations(selected: MyDelegation[]) {
    const { delegations } = this.state
    this.setState({ delegations: { ...delegations, selected } })
  }

  private setSelectDelegationsOpen(isSelectOpen: boolean, delay?: number) {
    setTimeout(() => {
      const { delegations } = this.state
      this.setState({ delegations: { ...delegations, isSelectOpen } })
    }, delay)
  }

  private cancel() {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private confirm() {
    const { onConfirm } = this.props
    this.sendInvitations()
    if (onConfirm) {
      onConfirm()
    }
  }

  private isInvitationValid() {
    const { contacts, delegations, permissions } = this.state
    return (
      !!contacts.selected.length &&
      !!delegations.selected.length &&
      !!permissions.length
    )
  }

  private getDelegationData(
    receiver: Contact,
    delegation: MyDelegation
  ): sdk.IRequestAcceptDelegation['content']['delegationData'] {
    const { isPCR } = this.props
    const { permissions } = this.state

    return {
      account: receiver.publicIdentity.address,
      id: sdk.UUID.generate(),
      isPCR,
      parentId: delegation.id,
      permissions,
    }
  }

  private sendSingleInvitation(
    receiver: Contact,
    delegation: Delegations.Entry
  ) {
    const { selectedIdentity } = this.props
    const { metaData } = delegation

    const delegationData = this.getDelegationData(receiver, delegation)

    const messageBody: sdk.IRequestAcceptDelegation = {
      content: {
        delegationData,
        metaData,
        signatures: {
          inviter: selectedIdentity.identity.signStr(
            JSON.stringify(delegationData)
          ),
        },
      },
      type: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION,
    }

    MessageRepository.send([receiver], messageBody)
  }

  private sendInvitations() {
    const { contacts, delegations } = this.state

    if (this.isInvitationValid()) {
      contacts.selected.forEach((contact: Contact) => {
        delegations.selected.forEach((delegation: Delegations.Entry) => {
          this.sendSingleInvitation(contact, delegation)
        })
      })
    }
  }

  private createPools(
    contactsPool: Contact[],
    delegationsPool: MyDelegation[]
  ) {
    const { contactsSelected, delegationsSelected }: Props = this.props
    const { contacts, delegations }: State = this.state
    let combinedContactsPool = contactsPool
    let combinedDelegationsPool = delegationsPool

    // add selected contacts to pool if not already contained
    if (contactsSelected && contactsSelected.length) {
      const filteredContactsSelected = contactsSelected.filter(
        (selectedContact: Contact) =>
          !contactsPool.find(
            (poolContact: Contact) =>
              poolContact.publicIdentity.address ===
              selectedContact.publicIdentity.address
          )
      )
      combinedContactsPool = [...contactsPool, ...filteredContactsSelected]
    }

    // add selected delegations to pool if not already contained
    if (delegationsSelected && delegationsSelected.length) {
      const filteredContactsSelected = delegationsSelected.filter(
        (selectedDelegations: MyDelegation) =>
          !delegationsPool.find(
            (poolDelegations: MyDelegation) =>
              poolDelegations.id === selectedDelegations.id
          )
      )
      combinedDelegationsPool = [
        ...delegationsPool,
        ...filteredContactsSelected,
      ]
    }

    this.setState({
      contacts: {
        ...contacts,
        pool: combinedContactsPool,
      },
      delegations: {
        ...delegations,
        pool: combinedDelegationsPool,
      },
    })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  myDelegations: Delegations.getAllDelegations(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(MyDelegationsInviteModal)
