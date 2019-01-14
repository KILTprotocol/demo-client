import * as React from 'react'

import { Message } from '../../types/Message'

import './MessageListView.scss'

type Props = {
  messages: Message[]
  onDelete: (id: string) => void
  onOpen: (message: Message) => void
}

type State = {}

class MessageListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
    this.openMessage = this.openMessage.bind(this)
  }

  public render() {
    const { messages } = this.props
    return (
      <section className="MessageListView">
        {messages && !!messages.length && (
          <table>
            <thead>
              <tr>
                <th>Sender</th>
                <th>Type</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {messages.map((message: Message) => (
                <tr key={message.id}>
                  <td>{message.sender}</td>
                  <td className="message">
                    <div onClick={this.openMessage(message)}>
                      {message.body ? message.body.type : message.message}
                    </div>
                  </td>
                  <td className="actions">
                    <button
                      className="delete"
                      onClick={this.handleDelete(message.id)}
                    />
                    <button
                      className="open"
                      onClick={this.openMessage(message)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    )
  }

  private handleDelete = (id?: string): (() => void) => () => {
    if (id) {
      const { onDelete } = this.props
      onDelete(id)
    }
  }

  private openMessage = (message: Message): (() => void) => () => {
    const { onOpen } = this.props
    onOpen(message)
  }
}

export default MessageListView
