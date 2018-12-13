import * as React from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'semantic-ui-react'

interface Props {}

interface State {
  contacts: any[]
}

class ContactListComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      contacts: [],
    }
    fetch('http://localhost:3000/contacts')
      .then(response => response.json())
      .then((contacts: any) => {
        this.setState({ contacts })
      })
  }

  public render() {
    return (
      <section>
        <h1>Contact List</h1>
        <ul>{this.getContacts()}</ul>
      </section>
    )
  }

  private getContacts() {
    return this.state.contacts.map((contact: any) => {
      return (
        <li key={contact.key}>
          {contact.name} / {contact.key}
          <br />
          <Button onClick={this.sendMessage.bind(this, contact.key)}>
            send message
          </Button>
          {/*TODO: remove when identity selection available*/}
          <Link to={`/messages/inbox/${contact.key}`}>view messages</Link>
        </li>
      )
    })
  }

  private sendMessage = (key: string): void => {
    // set own id

    // TODO: move to service and or effect
    fetch('http://localhost:3000/messaging', {
      body: JSON.stringify({
        message: 'message an ' + key,
        receiver: key,
        sender: key,
      }),
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
      mode: 'cors',
    })
  }
}

export default ContactListComponent
