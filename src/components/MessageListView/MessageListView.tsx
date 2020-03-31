import { IMessage } from '@kiltprotocol/sdk-js'
import React from 'react'

import MessageRepository, {
  IMessageOutput,
} from '../../services/MessageRepository'
import { ICType } from '../../types/Ctype'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import DateTime from '../DateTime/DateTime'
import MessageSubject from '../MessageSubject/MessageSubject'

import './MessageListView.scss'

type CreateReceiveErrors = { createdAt: string[]; receivedAt: string[] }

type Props = {
  messages: IMessageOutput[]
  onDelete: (message: IMessage) => void
  onOpen: (message: IMessage) => void
}

type State = {}

class MessageListView extends React.Component<Props, State> {
  private static getCreateReceiveErrors(
    message: IMessageOutput
  ): CreateReceiveErrors {
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

  private static getDateTime(
    timestamp: number | undefined,
    errorMessages: string[]
  ): JSX.Element {
    return (
      <span
        className={errorMessages.length ? 'invalid' : ''}
        title={errorMessages.join(', ')}
      >
        <DateTime timestamp={timestamp} />
      </span>
    )
  }

  private static getCTypePresentations(message: IMessageOutput): JSX.Element[] {
    const cTypeHashes: Array<ICType['cType']['hash']> = MessageRepository.getCTypeHashes(
      message
    )
    return cTypeHashes.map((cTypeHash: ICType['cType']['hash']) => (
      <CTypePresentation
        key={cTypeHash}
        cTypeHash={cTypeHash}
        interactive
        linked
      />
    ))
  }

  private handleDelete(message: IMessage): void {
    const { onDelete } = this.props
    onDelete(message)
  }

  private openMessage(message: IMessage): void {
    const { onOpen } = this.props
    onOpen(message)
  }

  public render(): JSX.Element {
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
                  CType
                  <br />
                  created
                  <br />
                  received
                </th>
                <th className="sender-subject">
                  Sender
                  <br />
                  Subject
                  <br />
                  CType
                </th>
                <th className="sender">Sender</th>
                <th className="subject">Subject</th>
                <th className="cType">CType</th>
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
              {messages.map((message: IMessageOutput) => {
                const createReceiveErrors = MessageListView.getCreateReceiveErrors(
                  message
                )
                const created = MessageListView.getDateTime(
                  message.createdAt,
                  createReceiveErrors.createdAt
                )
                const received = MessageListView.getDateTime(
                  message.receivedAt,
                  createReceiveErrors.receivedAt
                )
                return (
                  <tr key={message.messageId}>
                    <td className="sender-subject-created-received">
                      <div>
                        <ContactPresentation
                          address={message.senderAddress}
                          interactive
                        />
                      </div>
                      <div onClick={this.openMessage.bind(this, message)}>
                        <MessageSubject message={message} />
                      </div>
                      {MessageListView.getCTypePresentations(message)}
                      <div title="created">{created}</div>
                      <div title="received">{received}</div>
                    </td>
                    <td className="sender-subject">
                      <div>
                        <ContactPresentation
                          address={message.senderAddress}
                          interactive
                        />
                      </div>
                      <div onClick={this.openMessage.bind(this, message)}>
                        <MessageSubject message={message} />
                      </div>
                      {MessageListView.getCTypePresentations(message)}
                    </td>
                    <td className="sender">
                      <ContactPresentation
                        address={message.senderAddress}
                        interactive
                      />
                    </td>
                    <td className="subject">
                      <div onClick={this.openMessage.bind(this, message)}>
                        <MessageSubject message={message} />
                      </div>
                    </td>
                    <td className="cType">
                      {MessageListView.getCTypePresentations(message)}
                    </td>
                    <td className="created">{created}</td>
                    <td className="received">{received}</td>
                    <td className="created_received">
                      <div title="created">{created}</div>
                      <div title="received">{received}</div>
                    </td>
                    <td className="actionsTd">
                      <div>
                        <button
                          type="button"
                          className="delete"
                          onClick={this.handleDelete.bind(this, message)}
                        />
                        <button
                          type="button"
                          className="open"
                          onClick={this.openMessage.bind(this, message)}
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
}

export default MessageListView
