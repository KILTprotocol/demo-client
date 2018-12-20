import * as React from 'react'
import { connect } from 'react-redux'
import ContactRepository from '../../services/ContactRepository'
import MessageRepository from '../../services/MessageRepository'
import {
  ImmutableWalletState,
  WalletStateEntry,
} from '../../state/ducks/WalletRedux'
import { Contact } from './Contact'
import {Crypto} from "@kiltprotocol/prototype-sdk";
import u8aToU8a from "@polkadot/util/u8a/toU8a";
import u8aToHex from "@polkadot/util/u8a/toHex";

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
          <button onClick={this.sendMessage(contact)}>Send</button>
        </li>
      )
    })
  }

  private sendMessage = (contact: Contact): (() => void) => () => {
    if (this.props.selectedIdentity) {
      let encryptedMessage = Crypto.encryptAsymmetric(u8aToU8a('Hello ' + contact.name),
          u8aToU8a(contact.encryptionKey), this.props.selectedIdentity.identity.boxKeyPair.secretKey);
      MessageRepository.send({
        message: u8aToHex(encryptedMessage.box),
        nonce: u8aToHex(encryptedMessage.nonce),
        sender: this.props.selectedIdentity.alias,
        receiverKey: contact.key,
        senderKey: u8aToHex(this.props.selectedIdentity.identity.signKeyPair.publicKey),
        senderEncryptionKey: u8aToHex(this.props.selectedIdentity.identity.boxKeyPair.publicKey),
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
