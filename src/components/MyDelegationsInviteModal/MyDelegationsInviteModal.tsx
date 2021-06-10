import {
  IRequestAcceptDelegation,
  MessageBodyType,
  Permission,
} from '@kiltprotocol/types'
import { UUID } from '@kiltprotocol/utils'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import MessageRepository from '../../services/MessageRepository'
import * as Contacts from '../../state/ducks/Contacts'
import * as Delegations from '../../state/ducks/Delegations'
import { IMyDelegation } from '../../state/ducks/Delegations'
import * as Wallet from '../../state/ducks/Wallet'
import {
  persistentStoreInstance,
  State as ReduxState,
} from '../../state/PersistentStore'
import { IContact, IMyIdentity } from '../../types/Contact'
import Modal, { ModalType } from '../Modal/Modal'
import SelectContacts from '../SelectContacts/SelectContacts'
import SelectDelegations from '../SelectDelegations/SelectDelegations'
import SelectPermissions from '../SelectPermissions/SelectPermissions'

import './MyDelegationsInviteModal.scss'

type StateProps = {
  myDelegations: IMyDelegation[]
  selectedIdentity?: IMyIdentity
}

type OwnProps = {
  delegationsSelected?: IMyDelegation[]
  isPCR: boolean

  contactsPool?: IContact[]
  contactsSelected?: IContact[]
  delegationsPool?: IMyDelegation[]

  onCancel?: () => void
  onConfirm?: () => void
}

type Props = StateProps & OwnProps

type State = {
  contacts: {
    isSelectOpen: boolean
    selected: IContact[]

    pool?: IContact[]
  }
  delegations: {
    isSelectOpen: boolean
    selected: IMyDelegation[]

    pool?: IMyDelegation[]
  }
  permissions: Permission[]
}

class MyDelegationsInviteModal extends React.Component<Props, State> {
  private ref: React.RefObject<Modal>

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
    this.ref = React.createRef()
  }

  public componentDidMount(): void {
    const { contactsPool, delegationsPool, myDelegations }: Props = this.props

    this.createPools(
      contactsPool ||
      Contacts.getMyContacts(persistentStoreInstance.store.getState()),
      delegationsPool || myDelegations
    )
  }

  private getModalElement(): JSX.Element {
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
        ref={this.ref}
        catchBackdropClick={contacts.isSelectOpen || delegations.isSelectOpen}
        className="small"
        header={`Please select ${selectables.join(', ')}`}
        preventCloseOnCancel
        preventCloseOnConfirm
        type={ModalType.BLANK}
        showOnInit
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
                (contact: IContact) => contact.publicIdentity.address
              )}
              isMulti
              closeMenuOnSelect
              onChange={this.changeContacts}
              onMenuOpen={() => this.setSelectContactsOpen(true)}
              onMenuClose={() => this.setSelectContactsOpen(false, 500)}
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
              isMulti
              closeMenuOnSelect
              placeholder={isPCR ? `Select PCRs…` : undefined}
              filter={this.filterDelegations}
              onChange={this.changeDelegations}
              onMenuOpen={() => this.setSelectDelegationsOpen(true)}
              onMenuClose={() => this.setSelectDelegationsOpen(false, 500)}
            />
          )}
        </div>

        <footer>
          <button type="button" className="cancel" onClick={this.cancel}>
            Cancel
          </button>
          <button
            type="button"
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

  private getDelegationData(
    receiver: IContact,
    delegation: IMyDelegation
  ): IRequestAcceptDelegation['content']['delegationData'] {
    const { isPCR } = this.props
    const { permissions } = this.state

    return {
      account: receiver.publicIdentity.address,
      id: UUID.generate(),
      isPCR,
      parentId: delegation.id,
      permissions,
    }
  }

  private setSelectDelegationsOpen(
    isSelectOpen: boolean,
    delay?: number
  ): void {
    setTimeout(() => {
      const { delegations } = this.state
      this.setState({ delegations: { ...delegations, isSelectOpen } })
    }, delay)
  }

  private setSelectContactsOpen(isSelectOpen: boolean, delay?: number): void {
    setTimeout(() => {
      const { contacts } = this.state
      this.setState({ contacts: { ...contacts, isSelectOpen } })
    }, delay)
  }

  private changePermissions(newPermissions: Permission[]): void {
    this.setState({ permissions: newPermissions })
  }

  private changeContacts(selected: IContact[]): void {
    const { contacts } = this.state
    this.setState({ contacts: { ...contacts, selected } })
  }

  private changeDelegations(selected: IMyDelegation[]): void {
    const { delegations } = this.state
    this.setState({ delegations: { ...delegations, selected } })
  }

  private filterDelegations(delegation: IMyDelegation): boolean {
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
      !delegation.permissions.includes(Permission.DELEGATE)
    )
  }

  private cancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private confirm(): void {
    const { onConfirm } = this.props
    this.sendInvitations()
    if (onConfirm) {
      onConfirm()
    }
  }

  private isInvitationValid(): boolean {
    const { contacts, delegations, permissions } = this.state
    return (
      !!contacts.selected.length &&
      !!delegations.selected.length &&
      !!permissions.length
    )
  }

  public show(): void {
    if (this.ref.current) {
      this.ref.current.show()
    }
  }

  public hide(): void {
    if (this.ref.current) {
      this.ref.current.hide()
    }
  }

  private sendSingleInvitation(
    receiver: IContact,
    delegation: Delegations.Entry
  ): void {
    const { selectedIdentity } = this.props
    const { metaData } = delegation
    if (!selectedIdentity) {
      throw new Error('No selected Identity')
    }
    const delegationData = this.getDelegationData(receiver, delegation)

    const messageBody: IRequestAcceptDelegation = {
      content: {
        delegationData,
        metaData,
        signatures: {
          inviter: selectedIdentity.identity.signStr(
            JSON.stringify(delegationData)
          ),
        },
      },
      type: MessageBodyType.REQUEST_ACCEPT_DELEGATION,
    }

    MessageRepository.send([receiver], messageBody)
  }

  private sendInvitations(): void {
    const { contacts, delegations } = this.state

    if (this.isInvitationValid()) {
      contacts.selected.forEach((contact: IContact) => {
        delegations.selected.forEach((delegation: Delegations.Entry) => {
          this.sendSingleInvitation(contact, delegation)
        })
      })
    }
  }

  private createPools(
    contactsPool: IContact[],
    delegationsPool: IMyDelegation[]
  ): void {
    const { contactsSelected, delegationsSelected }: Props = this.props
    const { contacts, delegations }: State = this.state
    let combinedContactsPool = contactsPool
    let combinedDelegationsPool = delegationsPool

    // add selected contacts to pool if not already contained
    if (contactsSelected && contactsSelected.length) {
      const filteredContactsSelected = contactsSelected.filter(
        (selectedContact: IContact) =>
          !contactsPool.find(
            (poolContact: IContact) =>
              poolContact.publicIdentity.address ===
              selectedContact.publicIdentity.address
          )
      )
      combinedContactsPool = [...contactsPool, ...filteredContactsSelected]
    }

    // add selected delegations to pool if not already contained
    if (delegationsSelected && delegationsSelected.length) {
      const filteredContactsSelected = delegationsSelected.filter(
        (selectedDelegations: IMyDelegation) =>
          !delegationsPool.find(
            (poolDelegations: IMyDelegation) =>
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

  public render(): JSX.Element {
    return (
      <section className="MyDelegationsInviteModal">
        {this.getModalElement()}
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  myDelegations: Delegations.getAllDelegations(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(MyDelegationsInviteModal)
