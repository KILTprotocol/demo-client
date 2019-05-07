import * as React from 'react'
import { connect } from 'react-redux'

import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import ContactRepository from '../../services/ContactRepository'
import errorService from '../../services/ErrorService'
import * as Contacts from '../../state/ducks/Contacts'
import { State as ReduxState } from '../../state/PersistentStore'
import { Contact } from '../../types/Contact'

import './ContactList.scss'

interface Props {
  // mapStateToProps
  myContacts: Contact[]
}

interface State {
  allContacts: Contact[]

  showAllContacts?: boolean
}

class ContactList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      allContacts: [],
    }

    this.toggleContacts = this.toggleContacts.bind(this)
    this.fetchAllContacts = this.fetchAllContacts.bind(this)
  }

  public render() {
    const { myContacts } = this.props
    const { allContacts, showAllContacts } = this.state

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
            <>
              <button className="refresh" onClick={this.fetchAllContacts} />
              <button className="toggleContacts" onClick={this.toggleContacts}>
                My contacts
              </button>
            </>
          )}
          {!showAllContacts && (
            <button className="toggleContacts" onClick={this.toggleContacts}>
              All contacts
            </button>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th className="name">Name</th>
            </tr>
          </thead>
          <tbody>
            {!_contacts.length && (
              <tr>
                <td>{noContactsMessage}</td>
              </tr>
            )}
            {!!_contacts.length &&
              _contacts.map((contact: Contact) => this.getContactRow(contact))}
          </tbody>
        </table>
      </section>
    )
  }

  private getContactRow(contact: Contact) {
    const { publicIdentity } = contact
    const { address } = publicIdentity

    return (
      <tr key={address}>
        <td className="name">
          <ContactPresentation
            address={address}
            interactive={true}
            fullSizeActions={true}
          />
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
}

const mapStateToProps = (state: ReduxState) => ({
  myContacts: Contacts.getMyContacts(state),
})

export default connect(mapStateToProps)(ContactList)
