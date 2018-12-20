import * as React from 'react'
import { connect } from 'react-redux'

import MessageRepository from '../../services/MessageRepository'
import {
  ImmutableWalletState,
  WalletStateEntry,
} from '../../state/ducks/WalletRedux'
import { MessageD } from '../../types/Message'
import './MessageList.scss'
import u8aToU8a from '@polkadot/util/u8a/toU8a'
import { Crypto } from '@kiltprotocol/prototype-sdk'
import { EncryptedAsymmetric } from '@kiltprotocol/prototype-sdk/build/crypto/Crypto'
import u8aToString from '@polkadot/util/u8a/toString'

interface Props {
  selectedIdentity?: WalletStateEntry
}

interface State {
  messageOutput: MessageD[] | string
}

class MessageList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      messageOutput: '',
    }
  }

  public render() {
    let messageOutput
    if (Array.isArray(this.state.messageOutput)) {
      messageOutput = (
        <table>
          <thead>
            <tr>
              <th>from:</th>
              <th>message:</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {this.state.messageOutput.map((message: MessageD) => (
              <tr key={message.id}>
                <td>{message.sender}</td>
                <td>{message.message}</td>
                <td>
                  <button
                    className="delete"
                    onClick={this.deleteMessage(message)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    } else {
      messageOutput = this.state.messageOutput
    }

    return (
      <section className="MessageList">
        <h1>Message List</h1>
        {messageOutput}
      </section>
    )
  }

  public componentDidMount() {
    if (this.props.selectedIdentity) {
      this.setState({ messageOutput: 'Fetching messages' })
      this.getMessages(this.props.selectedIdentity)
    } else {
      this.setState({ messageOutput: 'Could not retrieve messages' })
    }
  }

  public componentWillReceiveProps(props: Props) {
    if (this.selectIdForTheFirstTime(props) || this.changeId(props)) {
      this.setState({ messageOutput: 'Fetching messages' })
      this.getMessages(props.selectedIdentity)
    } else {
      this.setState({ messageOutput: 'Could not retrieve messages' })
    }
  }

  private selectIdForTheFirstTime(props: Props) {
    return !this.props.selectedIdentity && !!props.selectedIdentity
  }

  private changeId(props: Props) {
    return (
      // old and new ids are existent
      // (we need to verify this for the next condition)
      !!this.props.selectedIdentity &&
      !!props.selectedIdentity &&
      // if the publicKeys of old and new identities are different
      props.selectedIdentity.identity.seedAsHex !==
        this.props.selectedIdentity.identity.seedAsHex
    )
  }

  private getMessages(identity?: WalletStateEntry) {
    // if we didn't not get a identity by params
    // we assume we wanna fetch the message for current identity
    const _identity = identity || this.props.selectedIdentity
    let messageOutput
    if (_identity) {
      MessageRepository.findByMyIdentity(_identity.identity).then(
        (messages: MessageD[]) => {
          if (messages.length) {
            for (const m of messages) {
              const ea: EncryptedAsymmetric = {
                box: u8aToU8a(m.message),
                nonce: u8aToU8a(m.nonce),
              }
              const decoded = Crypto.decryptAsymmetric(
                ea,
                u8aToU8a(m.senderEncryptionKey),
                _identity.identity.boxKeyPair.secretKey
              )
              if (!decoded) {
                m.message = 'ERROR DECODING MESSAGE'
              } else {
                m.message = u8aToString(decoded)
              }
            }
            messageOutput = messages
          } else {
            messageOutput = 'No messages found'
          }
          this.setState({ messageOutput })
        }
      )
    } else {
      this.setState({ messageOutput: 'No messages found' })
    }
  }

  private deleteMessage = (message: MessageD): (() => void) => () => {
    if (message.id) {
      MessageRepository.deleteByMessageId(message.id).then(() => {
        this.getMessages()
      })
    }
  }
}

const mapStateToProps = (state: { wallet: ImmutableWalletState }) => {
  return {
    selectedIdentity: state.wallet.get('selected'),
  }
}

export default connect(mapStateToProps)(MessageList)
