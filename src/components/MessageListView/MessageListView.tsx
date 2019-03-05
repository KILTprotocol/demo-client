import { IMessage } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { MessageOutput } from '../../services/MessageRepository'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import DateTime from '../DateTime/DateTime'
import MessageSubject from '../MessageSubject/MessageSubject'

import './MessageListView.scss'

type CreateReceiveErrors = { createdAt: string[]; receivedAt: string[] }

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
                const createReceiveErrors = this.getCreateReceiveErrors(message)
                const created = this.getDateTime(
                  message.createdAt,
                  createReceiveErrors.createdAt
                )
                const received = this.getDateTime(
                  message.receivedAt,
                  createReceiveErrors.receivedAt
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
                      <div title={`created`}>{created}</div>
                      <div title={`received`}>{received}</div>
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
                      <div title={`created`}>{created}</div>
                      <div title={`received`}>{received}</div>
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

  private getCreateReceiveErrors(message: MessageOutput) {
    const { createdAt, receivedAt } = message
    const validDifference = 1000
    const createReceiveErrors: CreateReceiveErrors = {
      createdAt: [],
      receivedAt: [],
    }

    if (!receivedAt) {
      createReceiveErrors.receivedAt.push('No receive date found')
    } else if (createdAt > receivedAt) {
      const error = `Created after received`
      createReceiveErrors.createdAt.push(error)
      createReceiveErrors.receivedAt.push(error)
    } else if (createdAt + validDifference < receivedAt) {
      const error = `Received more than ${validDifference}ms after creation`
      createReceiveErrors.createdAt.push(error)
      createReceiveErrors.receivedAt.push(error)
    }

    return createReceiveErrors
  }

  private getDateTime(timestamp: number | undefined, errorMessages: string[]) {
    return (
      <span
        className={errorMessages.length ? 'invalid' : ''}
        title={errorMessages.join(', ')}
      >
        <DateTime timestamp={timestamp} />
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
