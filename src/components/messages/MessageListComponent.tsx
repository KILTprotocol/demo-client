import * as React from 'react'
import { connect } from 'react-redux'
import { WalletState, WalletStateEntry } from '../../state/ducks/WalletRedux'

interface Props {
  selectedIdentity: WalletStateEntry | null
}

interface State {
  messageOutput: HTMLElement | string
}

class MessageListComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      messageOutput: '',
    }
  }

  public render() {
    return (
      <section>
        <h1>Message List</h1>
        <ul>{this.state.messageOutput}</ul>
      </section>
    )
  }

  public componentDidMount() {
    if (!!this.props.selectedIdentity) {
      this.setState({ messageOutput: 'Fetching messages' })
      this.getMessages(this.props.selectedIdentity)
    } else {
      this.setState({ messageOutput: 'Could not retrieve messages' })
    }
  }

  public componentWillReceiveProps(props: any) {
    switch (true) {
      case !this.props.selectedIdentity && !!props.selectedIdentity:
      case !!this.props.selectedIdentity &&
        !!props.selectedIdentity &&
        props.selectedIdentity.identity.publicKeyAsHex !==
          this.props.selectedIdentity!.identity.publicKeyAsHex:
        this.setState({ messageOutput: 'Fetching messages' })
        this.getMessages(props.selectedIdentity)
        break
      default:
        this.setState({ messageOutput: 'Could not retrieve messages' })
    }
  }

  private getMessages(identity: WalletStateEntry | null) {
    if (identity) {
      fetch(
        `http://localhost:3000/messaging/inbox/${
          identity.identity.publicKeyAsHex
        }`
      )
        .then(response => response.json())
        .then((messages: any) => {
          let messageOutput
          if (messages.length) {
            messageOutput = messages.map((message: any) => (
              <li key={message.id}>
                <h4>from:</h4>
                <p>{message.receiver}</p>
                <h4>message:</h4>
                <p>{message.message}</p>
                <br />
                <br />
                <br />
              </li>
            ))
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
