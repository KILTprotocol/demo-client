import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { connect } from 'react-redux'

import ContactRepository from '../../services/ContactRepository'
import delegationService from '../../services/DelegationsService'
import errorService from '../../services/ErrorService'
import { notifySuccess } from '../../services/FeedbackService'
import MessageRepository from '../../services/MessageRepository'
import * as Delegations from '../../state/ducks/Delegations'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import Modal, { ModalType } from '../Modal/Modal'
import SelectContacts from '../SelectContacts/SelectContacts'
import SelectDelegations from '../SelectDelegations/SelectDelegations'
import Spinner from '../Spinner/Spinner'

import './MyDelegationsInviteView.scss'

type Props = {
  contactsPool?: Contact[]
  contactsSelected?: Contact[]
  delegationsPool?: Delegations.Entry[]
  delegationsSelected?: Delegations.Entry[]
  onCancel?: () => void
  onConfirm?: () => void
  myDelegations: Delegations.Entry[]
  selectedIdentity: MyIdentity
}

type State = {
  contacts: {
    pool: Contact[]
    selected: Contact[]
    isSelectOpen: boolean
  }
  delegations: {
    pool: Delegations.Entry[]
    selected: Delegations.Entry[]
    isSelectOpen: boolean
  }
  permissions: sdk.Permission[]
}

class MyDelegationsInviteView extends React.Component<Props, State> {
  public static defaultProps: Partial<Props> = {}

  private modal: Modal | null

  private permissions = {
    change: (
      permission: sdk.Permission,
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const { permissions } = this.state
      const { checked } = event.target

      const newPermissions = permissions.filter(
        (_permission: sdk.Permission) => _permission !== permission
      )

      if (checked) {
        newPermissions.push(permission)
      }

      this.setState({ permissions: newPermissions })
    },
    getElement: () => {
      return (
        <div className="permissions">
          <h2>Permissions</h2>
          <div>
            {Object.keys(sdk.Permission).map((permission: string) => (
              <label key={permission}>
                <input
                  type="checkbox"
                  onChange={this.permissions.change.bind(this, permission)}
                />
                <span>{permission}</span>
              </label>
            ))}
          </div>
        </div>
      )
    },
  }

  private contacts = {
    changeSelected: (selected: Contact[]) => {
      const { contacts } = this.state
      this.setState({ contacts: { ...contacts, selected } })
    },
    getSelectElement: () => {
      const { contactsSelected } = this.props
      const { contacts } = this.state

      if (contactsSelected) {
        return (
          <div className="contactsSelect">
            <h2>Selected contact(s)</h2>
            <div>
              {contactsSelected.map(contact => (
                <ContactPresentation
                  key={contact.publicIdentity.address}
                  contact={contact}
                />
              ))}
            </div>
          </div>
        )
      } else if (contacts.pool) {
        return (
          <div className="contactsSelect">
            <h2>Select contact(s)</h2>
            <SelectContacts
              contacts={contacts.pool}
              name="selectContactsForInvite"
              isMulti={true}
              closeMenuOnSelect={true}
              onChange={this.contacts.changeSelected}
              onMenuOpen={this.contacts.setSelectOpen.bind(this, true)}
              onMenuClose={this.contacts.setSelectOpen.bind(this, false, 500)}
            />
          </div>
        )
      } else {
        return (
          <div className="contactsSelect">
            <h2>Select contact(s)</h2>
            <Spinner />
          </div>
        )
      }
    },
    setSelectOpen: (isSelectOpen: boolean, delay = 0) => {
      setTimeout(() => {
        const { contacts } = this.state
        this.setState({ contacts: { ...contacts, isSelectOpen } })
      }, delay)
    },
  }

  private delegations = {
    changeSelected: (selected: Delegations.Entry[]) => {
      const { delegations } = this.state
      this.setState({ delegations: { ...delegations, selected } })
    },
    getSelectElement: () => {
      const { delegationsSelected } = this.props
      const { delegations } = this.state

      if (delegationsSelected) {
        return (
          <div className="delegationsSelect">
            <h2>Selected delegation(s)</h2>
            <div>
              {delegationsSelected.map((delegation: Delegations.Entry) => (
                <div key={delegation.id}>
                  {delegation.metaData.alias}
                  <CTypePresentation
                    cTypeHash={delegation.cType}
                    inline={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      } else if (delegations.pool) {
        return (
          <div className="delegationsSelect">
            <h2>Select delegation(s)</h2>
            <SelectDelegations
              delegations={delegations.pool}
              name="selectDelegationsForInvite"
              isMulti={true}
              closeMenuOnSelect={true}
              onChange={this.delegations.changeSelected}
              onMenuOpen={this.delegations.setSelectOpen.bind(this, true)}
              onMenuClose={this.delegations.setSelectOpen.bind(
                this,
                false,
                500
              )}
            />
          </div>
        )
      } else {
        return (
          <div className="delegationsSelect">
            <h2>Select delegation(s)</h2>
            <Spinner />
          </div>
        )
      }
    },
    setSelectOpen: (isSelectOpen: boolean, delay = 0) => {
      setTimeout(() => {
        const { delegations } = this.state
        this.setState({ delegations: { ...delegations, isSelectOpen } })
      }, delay)
    },
  }

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

    this.contacts.changeSelected = this.contacts.changeSelected.bind(this)
    this.delegations.changeSelected = this.delegations.changeSelected.bind(this)
    this.permissions.change = this.permissions.change.bind(this)
    this.permissions.getElement = this.permissions.getElement.bind(this)
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
      <section className="MyDelegationsInviteView">
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
    const { contacts, delegations } = this.state

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
        {this.permissions.getElement()}
        {this.contacts.getSelectElement()}
        {this.delegations.getSelectElement()}
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
    delegation: Delegations.Entry
  ): sdk.IRequestAcceptDelegation['content']['delegationData'] {
    const { permissions } = this.state

    return {
      childDelegationId: delegationService.createID(),
      parentDelegationId: delegation.id,
      permissions,
    }
  }

  private sendSingleInvitation(
    receiver: Contact,
    delegationData: sdk.IRequestAcceptDelegation['content']['delegationData']
  ) {
    const { selectedIdentity } = this.props

    const request: sdk.IRequestAcceptDelegation = {
      content: {
        delegationData,
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
          this.sendSingleInvitation(contact, this.getDelegationData(delegation))
        })
      })
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  myDelegations: Delegations.getDelegations(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(MyDelegationsInviteView)
