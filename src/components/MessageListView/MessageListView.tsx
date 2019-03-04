import { IMessage } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import BaseUtilities from '../../services/BaseUtilities'
import { MessageOutput } from '../../services/MessageRepository'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import MessageSubject from '../MessageSubject/MessageSubject'

import './MessageListView.scss'

type Props = {
  messages: MessageOutput[]
  onDelete: (message: IMessage) => void
  onOpen: (message: IMessage) => void
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
                <th className="sender-subject-created-received">
                  Sender
                  <br />
                  Subject
                  <br />
                  created
                  <br />
                  received
                </th>
                <th className="sender-subject">
                  Sender
                  <br />
                  Subject
                </th>
                <th className="sender">Sender</th>
                <th className="subject">Subject</th>
                <th className="created">created</th>
                <th className="received">received</th>
                <th className="created_received">
                  created
                  <br />
                  received
                </th>
                <th className="actionTd" />
              </tr>
            </thead>
            <tbody>
              {messages.map((message: MessageOutput) => {
                const { created, received } = this.getCombinedDateTime(
                  message.createdAt,
                  message.receivedAt
                )

                return (
                  <tr key={message.messageId}>
                    <td className="sender-subject-created-received">
                      <div>
                        <ContactPresentation address={message.senderAddress} />
                      </div>
                      <div onClick={this.openMessage(message)}>
                        <MessageSubject message={message} />
                      </div>
                      <div title={`created: ${created}`}>c: {created}</div>
                      <div title={`received: ${received}`}>r: {received}</div>
                    </td>
                    <td className="sender-subject">
                      <div>
                        <ContactPresentation address={message.senderAddress} />
                      </div>
                      <div onClick={this.openMessage(message)}>
                        <MessageSubject message={message} />
                      </div>
                    </td>
                    <td className="sender">
                      <ContactPresentation address={message.senderAddress} />
                    </td>
                    <td className="subject">
                      <div onClick={this.openMessage(message)}>
                        <MessageSubject message={message} />
                      </div>
                    </td>
                    <td className="created">{created}</td>
                    <td className="received">{received}</td>
                    <td className="created_received">
                      <div title={`created: ${created}`}>c: {created}</div>
                      <div title={`received: ${received}`}>r: {received}</div>
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
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    )
  }

  private getCombinedDateTime(created: number, received: number | undefined) {
    const validDifference = 1000
    const errorMessages: { created: string[]; received: string[] } = {
      created: [],
      received: [],
    }

    if (!received) {
      errorMessages.received.push('No receive date found')
    } else if (created > received) {
      const message = `Created after received`
      errorMessages.created.push(message)
      errorMessages.received.push(message)
    } else if (created + validDifference < received) {
      const message = `Received more than ${validDifference}ms after creation`
      errorMessages.created.push(message)
      errorMessages.received.push(message)
    }

    return {
      created: this.getDateTime(created, errorMessages.created),
      received: this.getDateTime(received, errorMessages.received),
    }
  }

  private getDateTime(timestamp: number | undefined, errorMessages: string[]) {
    return (
      <span
        className={errorMessages.length ? 'invalid' : ''}
        title={errorMessages.join(', ')}
      >
        {BaseUtilities.getDateTime(timestamp)}
      </span>
    )
  }

  private handleDelete = (message: IMessage): (() => void) => () => {
    const { onDelete } = this.props
    onDelete(message)
  }

  private openMessage = (message: IMessage): (() => void) => () => {
    const { onOpen } = this.props
    onOpen(message)
  }
}

export default MessageListView
