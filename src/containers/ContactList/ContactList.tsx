import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'

import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import SelectCTypesModal from '../../components/Modal/SelectCTypesModal'
import MyDelegationsInviteModal from '../../components/MyDelegationsInviteModal/MyDelegationsInviteModal'
import SelectAction from '../../components/SelectAction/SelectAction'
import ContactRepository from '../../services/ContactRepository'
import errorService from '../../services/ErrorService'
import MessageRepository from '../../services/MessageRepository'
import * as Contacts from '../../state/ducks/Contacts'
import { State as ReduxState } from '../../state/PersistentStore'
import { Contact } from '../../types/Contact'
import { ICType } from '../../types/Ctype'

import './ContactList.scss'

interface Props {
  // mapStateToProps
  myContacts: Contact[]
}

interface State {
  allContacts: Contact[]

  contactForDelegationInvite?: Contact
  isPCR?: boolean
  showAllContacts?: boolean
}

class ContactList extends React.Component<Props, State> {
  private selectCTypesModal: SelectCTypesModal | null
  private selectedContact: Contact | undefined

  private inviteToDelegation = {
    cancel: () => {
      this.setState({ contactForDelegationInvite: undefined, isPCR: undefined })
    },
    confirm: () => {
      this.setState({ contactForDelegationInvite: undefined, isPCR: undefined })
    },
    request: (contactForDelegationInvite: Contact, isPCR: boolean) => {
      this.setState({
        contactForDelegationInvite,
        isPCR,
      })
    },
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      allContacts: [],
    }
    this.onCancelRequestClaim = this.onCancelRequestClaim.bind(this)
    this.onFinishRequestClaim = this.onFinishRequestClaim.bind(this)
    this.onRequestClaimForVerification = this.onRequestClaimForVerification.bind(
      this
    )
    this.toggleContacts = this.toggleContacts.bind(this)
    this.fetchAllContacts = this.fetchAllContacts.bind(this)
    this.inviteToDelegation.cancel = this.inviteToDelegation.cancel.bind(this)
    this.inviteToDelegation.confirm = this.inviteToDelegation.confirm.bind(this)
  }

  public render() {
    const { myContacts } = this.props
    const {
      allContacts,
      contactForDelegationInvite,
      isPCR,
      showAllContacts,
    } = this.state

    const _contacts = showAllContacts ? allContacts : myContacts
    const noContactsMessage = showAllContacts ? (
      <div className="noContactsMessage">No contacts found.</div>
    ) : (
      <div className="noContactsMessage">
        No bookmarked contacts found.{' '}
        <button className="allContacts" onClick={this.toggleContacts}>
          Fetch all contacts
        </button>
      </div>
    )

    return (
      <section className="ContactList">
        <h1>{showAllContacts ? 'All contacts' : 'My contacts'}</h1>
        <div className="contactActions">
          {showAllContacts && (
            <button className="refresh" onClick={this.fetchAllContacts} />
          )}
          <button
            className={`toggleContacts ${showAllContacts ? 'all' : 'my'}`}
            onClick={this.toggleContacts}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th className="name">Name</th>
              <th className="address">Address</th>
              <th className="actionTd" />
            </tr>
          </thead>
          <tbody>
            {!_contacts.length && (
              <tr>
                <td colSpan={3}>{noContactsMessage}</td>
              </tr>
            )}
            {!!_contacts.length &&
              _contacts.map((contact: Contact) => this.getContactRow(contact))}
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
          <MyDelegationsInviteModal
            isPCR={isPCR}
            contactsSelected={[contactForDelegationInvite]}
            onCancel={this.inviteToDelegation.cancel}
            onConfirm={this.inviteToDelegation.confirm}
          />
        )}
      </section>
    )
  }

  private getContactRow(contact: Contact) {
    const { publicIdentity } = contact
    const { address } = publicIdentity

    return (
      <tr key={address}>
        <td className="name">
          <ContactPresentation address={address} interactive={true} />
        </td>
        <td className="address" title={address}>
          {address}
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
                    contact,
                    false
                  ),
                  label: 'Invite to Delegation',
                },
                {
                  callback: this.inviteToDelegation.request.bind(
                    this,
                    contact,
                    true
                  ),
                  label: 'Invite to PCR',
                },
              ]}
            />
          </div>
        </td>
      </tr>
    )
  }

  private toggleContacts() {
    const { showAllContacts } = this.state

    this.setState({ showAllContacts: !showAllContacts })

    if (!showAllContacts) {
      this.fetchAllContacts()
    }
  }

  private fetchAllContacts() {
    ContactRepository.findAll()
      .then((allContacts: Contact[]) => {
        this.setState({ allContacts })
      })
      .catch(error => {
        errorService.log({
          error,
          message: 'Could not fetch allContacts',
          origin: 'ContactList.componentDidMount()',
          type: 'ERROR.FETCH.GET',
        })
      })
  }

  private onCancelRequestClaim() {
    this.selectedContact = undefined
  }

  private onFinishRequestClaim(selectedCTypes: ICType[]) {
    if (this.selectedContact && selectedCTypes) {
      const messageBody: sdk.IRequestClaimsForCtype = {
        content: selectedCTypes[0].cType.hash,
        type: sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPE,
      }

      MessageRepository.send([this.selectedContact], messageBody)
    }
  }

  private onRequestClaimForVerification = (contact?: Contact) => {
    this.selectedContact = contact
    if (this.selectCTypesModal) {
      this.selectCTypesModal.show()
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  myContacts: Contacts.getMyContacts(state),
})

export default connect(mapStateToProps)(ContactList)
