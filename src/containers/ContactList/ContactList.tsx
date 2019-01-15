import * as React from 'react'

import ContactRepository from '../../services/ContactRepository'
import { Contact } from '../../types/Contact'

import './ContactList.scss'

interface Props {}

interface State {
  contacts: Contact[]
}

class ContactList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      contacts: [],
    }
  }

  public componentDidMount() {
    ContactRepository.findAll().then((contacts: Contact[]) => {
      this.setState({ contacts })
    })
  }

  public render() {
    return (
      <section className="ContactList">
        <h1>Contacts</h1>
        <ul>{this.getContacts()}</ul>
      </section>
    )
  }

  private getContacts(): JSX.Element[] {
    const { contacts } = this.state
    return contacts.map((contact: Contact) => {
      return (
        <li key={contact.key}>
          {contact.name} / {contact.key}
        </li>
      )
    })
  }
}

export default ContactList
