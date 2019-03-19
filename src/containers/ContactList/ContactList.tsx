import {
  IRequestClaimsForCtype,
  MessageBodyType,
} from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import SelectCTypesModal from '../../components/Modal/SelectCTypesModal'
import MyDelegationsInviteView from '../../components/MyDelegationsInviteModal/MyDelegationsInviteModal'
import SelectAction from '../../components/SelectAction/SelectAction'
import contactRepository from '../../services/ContactRepository'
import CTypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import MessageRepository from '../../services/MessageRepository'
import { Contact } from '../../types/Contact'
import { ICType } from '../../types/Ctype'
import { BlockUi } from '../../types/UserFeedback'

import './ContactList.scss'

interface Props {}

interface State {
  contacts: Contact[]
  cTypes: ICType[]
  contactForDelegationInvite?: Contact
}

class ContactList extends React.Component<Props, State> {
  private selectCTypesModal: SelectCTypesModal | null
  private selectedContact: Contact | undefined

  private inviteToDelegation = {
    cancel: () => {
      this.setState({ contactForDelegationInvite: undefined })
    },
    confirm: () => {
      this.setState({ contactForDelegationInvite: undefined })
    },
    request: (contact: Contact) => {
      this.setState({ contactForDelegationInvite: contact })
    },
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      cTypes: [],
      contacts: [],
    }
    this.onCancelRequestClaim = this.onCancelRequestClaim.bind(this)
    this.onFinishRequestClaim = this.onFinishRequestClaim.bind(this)
    this.onRequestClaimForVerification = this.onRequestClaimForVerification.bind(
      this
    )
    this.inviteToDelegation.cancel = this.inviteToDelegation.cancel.bind(this)
    this.inviteToDelegation.confirm = this.inviteToDelegation.confirm.bind(this)
  }

  public componentDidMount() {
    contactRepository
      .findAll()
      .then((contacts: Contact[]) => {
        this.setState({ contacts })
      })
      .catch(error => {
        errorService.log({
          error,
          message: 'Could not fetch contacts',
          origin: 'ContactList.componentDidMount()',
          type: 'ERROR.FETCH.GET',
        })
      })
    CTypeRepository.findAll()
      .then((cTypes: ICType[]) => {
        this.setState({ cTypes })
      })
      .catch(error => {
        errorService.log({
          error,
          message: 'Could not fetch CTYPEs',
          origin: 'ContactList.componentDidMount()',
          type: 'ERROR.FETCH.GET',
        })
      })
  }

  public render() {
    const { contacts, contactForDelegationInvite } = this.state
    return (
      <section className="ContactList">
        <h1>Contacts</h1>
        <table>
          <thead>
            <tr>
              <th className="name">Name</th>
              <th className="address">Address</th>
              <th className="actionTd" />
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact: Contact) => (
              <tr key={contact.publicIdentity.address}>
                <td className="name">
                  <ContactPresentation
                    address={contact.publicIdentity.address}
                  />
                </td>
                <td className="address" title={contact.publicIdentity.address}>
                  {contact.publicIdentity.address}
                </td>
                <td className="actionsTd">
                  <div>
                    <SelectAction
                      actions={[
                        {
                          callback: this.onRequestClaimForVerification.bind(
                            this,
                            contact
                          ),
                          label: 'Request claim(s)',
                        },
                        {
                          callback: this.inviteToDelegation.request.bind(
                            this,
                            contact
                          ),
                          label: 'Invite to Delegation',
                        },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <SelectCTypesModal
          ref={el => {
            this.selectCTypesModal = el
          }}
          placeholder="Select cType#{multi}…"
          onCancel={this.onCancelRequestClaim}
          onConfirm={this.onFinishRequestClaim}
        />
        {contactForDelegationInvite && (
          <MyDelegationsInviteView
            contactsSelected={[contactForDelegationInvite]}
            onCancel={this.inviteToDelegation.cancel}
            onConfirm={this.inviteToDelegation.confirm}
          />
        )}
      </section>
    )
  }

  private onCancelRequestClaim() {
    this.selectedContact = undefined
  }

  private onFinishRequestClaim(selectedCTypes: ICType[]) {
    if (this.selectedContact && selectedCTypes) {
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Sending Message',
      })
      const request: IRequestClaimsForCtype = {
        content: selectedCTypes[0].cType.hash,
        type: MessageBodyType.REQUEST_CLAIMS_FOR_CTYPE,
      }

      MessageRepository.send(this.selectedContact, request)
        .then(() => {
          blockUi.remove()
          notifySuccess('Request Claims successfully sent.')
        })
        .catch(error => {
          blockUi.remove()
          errorService.log({
            error,
            message: `Could not send message ${request.type} to ${
              this.selectedContact!.metaData.name
            }`,
            origin: 'ContactList.onFinishRequestClaim()',
            type: 'ERROR.FETCH.POST',
          })
        })
    }
  }

  private onRequestClaimForVerification = (contact?: Contact) => {
    this.selectedContact = contact
    if (this.selectCTypesModal) {
      this.selectCTypesModal.show()
    }
  }
}

export default ContactList
