import * as React from 'react'
import { connect } from 'react-redux'
import { WalletState, WalletStateEntry } from '../../state/ducks/WalletRedux'
import { Message } from './Message'

interface Props {
  selectedIdentity?: WalletStateEntry
}

interface State {
  messageOutput: Message[] | string
}

class MessageListComponent extends React.Component<Props, State> {
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
        <ul>
          {this.state.messageOutput.map((message: Message) => (
            <li key={message.id}>
              <h4>from:</h4>
              <p>{message.receiver}</p>
              <h4>message:</h4>
              <p>{message.message}</p>
              <br />
              <br />
              <br />
            </li>
          ))}
        </ul>
      )
    } else {
      messageOutput = this.state.messageOutput
    }

    return (
      <section>
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
      props.selectedIdentity.identity.publicKeyAsHex !==
        this.props.selectedIdentity.identity.publicKeyAsHex
    )
  }

  private getMessages(identity?: WalletStateEntry) {
    if (identity) {
      fetch(
        `http://localhost:3000/messaging/inbox/${
          identity.identity.publicKeyAsHex
        }`
      )
        .then(response => response.json())
        .then((messages: Message[]) => {
          let messageOutput
          if (messages.length) {
            messageOutput = messages
          } else {
            messageOutput =
              'No messages found for ' +
              this.props.selectedIdentity!.identity.publicKeyAsHex
          }
          this.setState({ messageOutput })
        })
    }
  }
}

const mapStateToProps = (state: { wallet: WalletState }) => {
  return {
    selectedIdentity: state.wallet.get('selected'),
  }
}

export default connect(mapStateToProps)(MessageListComponent)
