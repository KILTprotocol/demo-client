import React from 'react'

import { Message } from '../../types/Message'
import Code from '../Code/Code'

import './MessageDetailView.scss'

type Props = {
  message: Message
  onDelete: (id: string) => void
  onCancel: (id: string) => void
}

type State = {}

class MessageDetailView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
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
          <button className="cancel" onClick={this.handleCancel}>
            Cancel
          </button>
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

  private handleCancel() {
    const { message, onCancel } = this.props
    if (message && message.id && onCancel) {
      onCancel(message.id)
    }
  }
}

export default MessageDetailView
