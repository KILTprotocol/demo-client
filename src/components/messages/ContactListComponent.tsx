import * as React from 'react'

interface Props {
  match: any,
}

interface State {
  messages: any[]
}

class MessageListComponent extends React.Component<Props, State> {

  pubKey: string

  constructor(props: Props) {
    super(props)
    this.state = {
      messages: [],
    }
    // todo: change when identity select works
    this.pubKey = this.props.match.params.pubKey
    fetch(`http://localhost:3000/messaging/inbox/${this.pubKey}`)
      .then(response => response.json())
      .then((messages: any) => {

        console.log('messages', messages)

        this.setState({ messages })
      })
  }

  public render() {
    return (
      <section>
        <h1>Message List</h1>
        <ul>{this.getMessages()}</ul>
      </section>
    )
  }

  private getMessages() {
    if (this.state.messages.length) {
      return this.state.messages.map((message: any) => (
          <li key={message.id}>
            <h4>from:</h4>
            <p>{message.receiver}</p>
            <h4>message:</h4>
            <p>{message.message}</p>
            <br /><br /><br />
          </li>
        )
      )
    } else {
      return 'No messages found'
    }
  }
}

export default MessageListComponent
