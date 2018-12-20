import * as React from 'react'
import { connect } from 'react-redux'
import ContactRepository from '../../services/ContactRepository'
import MessageRepository from '../../services/MessageRepository'
import {
  ImmutableWalletState,
  WalletStateEntry,
} from '../../state/ducks/WalletRedux'
import { Contact } from './Contact'

interface Props {
  selectedIdentity?: WalletStateEntry
}

interface State {
  contacts: Contact[]
}

class ContactListComponent extends React.Component<Props, State> {
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
      <section>
        <h1>Contact List</h1>
        <ul>{this.getContacts()}</ul>
      </section>
    )
  }

  private getContacts(): JSX.Element[] {
    return this.state.contacts.map((contact: Contact) => {
      return (
        <li key={contact.key}>
          {contact.name} / {contact.key}
          <button onClick={this.sendMessage(contact.key)}>Send</button>
        </li>
      )
    })
  }

  private sendMessage = (publicKeyAsHex: string): (() => void) => () => {
    if (this.props.selectedIdentity) {
      MessageRepository.send({
        message: 'message an ' + publicKeyAsHex,
        receiver: publicKeyAsHex,
        sender: this.props.selectedIdentity.identity.publicKeyAsHex,
      })
    }
  }
}

const mapStateToProps = (state: { wallet: ImmutableWalletState }) => {
  return {
    selectedIdentity: state.wallet.get('selected'),
  }
}

export default connect(mapStateToProps)(ContactListComponent)
