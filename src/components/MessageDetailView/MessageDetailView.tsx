import React from 'react'

import { Message } from '../../types/Message'
import Code from '../Code/Code'

type Props = {
  message: Message
  onDelete: (id: string) => void
}

type State = {}

class MessageDetailView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
  }

  public render() {
    const { message, children } = this.props
    return (
      <section className="MessageDetailView">
        <h4>Subject: {message.body ? message.body.type : message.message}</h4>
        <div>
          Contents:{' '}
          {message.body ? <Code>{message.body.content}</Code> : message.message}
        </div>
        <footer>
          {children}
          <button className="delete" onClick={this.handleDelete}>
            Delete
          </button>
        </footer>
      </section>
    )
  }

  private handleDelete() {
    const { message, onDelete } = this.props
    if (message && message.id && onDelete) {
      onDelete(message.id)
    }
  }
}

export default MessageDetailView
