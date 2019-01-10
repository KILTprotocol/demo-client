import * as React from 'react'

import ContactRepository from '../../services/ContactRepository'
import MessageRepository from '../../services/MessageRepository'
import { Contact } from '../../types/Contact'

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
        <h1>Registry Contacts</h1>
        <ul>{this.getContacts()}</ul>
      </section>
    )
  }

  private getContacts(): JSX.Element[] {
    return this.state.contacts.map((contact: Contact) => {
      return (
        <li key={contact.key}>
          {contact.name} / {contact.key}
          <button onClick={this.sendMessage(contact)}>Send</button>
        </li>
      )
    })
  }

  private sendMessage = (contact: Contact): (() => void) => () => {
    MessageRepository.send(contact, 'Hello ' + contact.name)
  }
}

export default ContactList
