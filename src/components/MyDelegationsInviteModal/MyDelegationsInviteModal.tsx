import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'

import ContactRepository from '../../services/ContactRepository'
import delegationService from '../../services/DelegationsService'
import errorService from '../../services/ErrorService'
import { notifySuccess } from '../../services/FeedbackService'
import MessageRepository from '../../services/MessageRepository'
import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation, MyRootDelegation } from '../../state/ducks/Delegations'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import Modal, { ModalType } from '../Modal/Modal'
import SelectContacts from '../SelectContacts/SelectContacts'
import SelectDelegations from '../SelectDelegations/SelectDelegations'
import SelectPermissions from '../SelectPermissions/SelectPermissions'

import './MyDelegationsInviteModal.scss'

type Props = {
  contactsPool?: Contact[]
  contactsSelected?: Contact[]
  delegationsPool?: Array<MyDelegation | MyRootDelegation>
  delegationsSelected?: Array<MyDelegation | MyRootDelegation>
  onCancel?: () => void
  onConfirm?: () => void
  myDelegations: Array<MyDelegation | MyRootDelegation>
  selectedIdentity: MyIdentity
}

type State = {
  contacts: {
    pool: Contact[]
    selected: Contact[]
    isSelectOpen: boolean
  }
  delegations: {
    pool: Array<MyDelegation | MyRootDelegation>
    selected: Array<MyDelegation | MyRootDelegation>
    isSelectOpen: boolean
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
        pool: props.contactsPool || [],
        selected: props.contactsSelected || [],
      },
      delegations: {
        isSelectOpen: false,
        pool: props.delegationsPool || [],
        selected: props.delegationsSelected || [],
      },
      permissions: [],
    }

    this.cancel = this.cancel.bind(this)
    this.confirm = this.confirm.bind(this)

    this.changePermissions = this.changePermissions.bind(this)

    this.changeContacts = this.changeContacts.bind(this)
    this.setSelectContactsOpen = this.setSelectContactsOpen.bind(this)

    this.changeDelegations = this.changeDelegations.bind(this)
    this.setSelectDelegationsOpen = this.setSelectDelegationsOpen.bind(this)
  }

  public componentDidMount() {
    const {
      contactsPool,
      contactsSelected,
      delegationsPool,
      delegationsSelected,
      myDelegations,
    }: Props = this.props
    const { contacts, delegations }: State = this.state

    if (!contactsPool && !contactsSelected) {
      ContactRepository.findAll().then((pool: Contact[]) => {
        this.setState({ contacts: { ...contacts, pool } })
      })
    }

    if (!delegationsPool && !delegationsSelected) {
      this.setState({ delegations: { ...delegations, pool: myDelegations } })
    }
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
    const { contactsSelected, delegationsSelected } = this.props
    const { contacts, delegations, permissions } = this.state

    const selectables = ['permissions']
    if (!contactsSelected) {
      selectables.push('contact(s)')
    }
    if (!delegationsSelected) {
      selectables.push('delegation(s)')
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
        <SelectPermissions
          permissions={permissions}
          onChange={this.changePermissions}
        />

        <div className="contactsSelect">
          {contactsSelected && <h2>Selected contact(s)</h2>}
          {!contactsSelected && <h2>Select contact(s)</h2>}
          <SelectContacts
            contacts={contacts.pool}
            name="selectContactsForInvite"
            defaultValues={contactsSelected}
            isMulti={true}
            closeMenuOnSelect={true}
            onChange={this.changeContacts}
            onMenuOpen={this.setSelectContactsOpen.bind(this, true)}
            onMenuClose={this.setSelectContactsOpen.bind(this, false, 500)}
          />
        </div>

        <div className="delegationsSelect">
          {delegationsSelected && <h2>Selected delegation(s)</h2>}
          {!delegationsSelected && <h2>Select delegation(s)</h2>}
          <SelectDelegations
            delegations={delegations.pool}
            name="selectDelegationsForInvite"
            defaultValues={delegationsSelected}
            isMulti={true}
            closeMenuOnSelect={true}
            onChange={this.changeDelegations}
            onMenuOpen={this.setSelectDelegationsOpen.bind(this, true)}
            onMenuClose={this.setSelectDelegationsOpen.bind(this, false, 500)}
          />
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

  private changePermissions(newPermissions: sdk.Permission[]) {
    console.log('newPermissions', newPermissions)

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

  private changeDelegations(selected: Array<MyDelegation | MyRootDelegation>) {
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
    delegation: MyDelegation | MyRootDelegation
  ): sdk.IRequestAcceptDelegation['content']['delegationData'] {
    const { permissions } = this.state

    return {
      account: receiver.publicIdentity.address,
      id: sdk.UUID.generate(),
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

    const request: sdk.IRequestAcceptDelegation = {
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

    MessageRepository.send(receiver, request)
      .then(() => {
        notifySuccess('Delegation invitation successfully sent.')
      })
      .catch(error => {
        errorService.log({
          error,
          message: `Could not send message ${request.type} to ${
            receiver!.metaData.name
          }`,
          origin: 'DelegationsView.confirmSelectContacts()',
          type: 'ERROR.FETCH.POST',
        })
      })
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
}

const mapStateToProps = (state: ReduxState) => ({
  myDelegations: Delegations.getDelegations(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(MyDelegationsInviteModal)
