import * as React from 'react'
import { Message, MessageOutput, } from '../../types/Message'
import KiltIdenticon from '../KiltIdenticon/KiltIdenticon'
import MessageSubject from '../MessageSubject/MessageSubject'

import './MessageListView.scss'

type Props = {
  messages: MessageOutput[]
  onDelete: (message: Message) => void
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
                <th className="sender">Sender</th>
                <th className="subject">Subject</th>
                <th className="actionTd" />
              </tr>
            </thead>
            <tbody>
              {messages.map((message: MessageOutput) => (
                <tr key={message.messageId}>
                  <td className="sender">
                    {message.sender ? (
                      <KiltIdenticon contact={message.sender} />
                    ) : (
                      message.senderAddress
                    )}
                  </td>
                  <td className="subject">
                    <div onClick={this.openMessage(message)}>
                      <MessageSubject message={message} />
                    </div>
                  </td>
                  <td className="actionsTd">
                    <div className="actions">
                      <button
                        className="delete"
                        onClick={this.handleDelete(message)}
                      />
                      <button
                        className="open"
                        onClick={this.openMessage(message)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    )
  }

  private handleDelete = (message: Message): (() => void) => () => {
    const { onDelete } = this.props
    onDelete(message)
  }

  private openMessage = (message: Message): (() => void) => () => {
    const { onOpen } = this.props
    onOpen(message)
  }
}

export default MessageListView
