import * as React from 'react'
import { connect } from 'react-redux'
import ContactRepository from '../../services/ContactRepository'
import MessageRepository from '../../services/MessageRepository'
import * as Wallet from '../../state/ducks/Wallet'
import { Contact } from '../../types/Contact'

interface Props {
  selectedIdentity?: Wallet.Entry
}

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
    if (this.props.selectedIdentity) {
      MessageRepository.send(
        this.props.selectedIdentity,
        contact,
        'Hello ' + contact.name
      )
    }
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    selectedIdentity: state.wallet.get('selected'),
  }
}

export default connect(mapStateToProps)(ContactList)
