import * as React from 'react'
import {
  Message,
  MessageBodyType,
  MessageOutput,
  RequestClaimForCtype,
} from '../../types/Message'
import KiltIdenticon from '../KiltIdenticon/KiltIdenticon'
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
                      <KiltIdenticon contact={message.sender} size={24} />
                    ) : (
                      message.senderAddress
                    )}
                  </td>
                  <td className="subject">
                    <div onClick={this.openMessage(message)}>
                      {this.getMessageInfo(message)}
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

  private getMessageInfo(message: Message) {
    if (!message || !message.body || !message.body.content) {
      return undefined
    }

    if (!message.body || !message.body.type) {
      return message.message
    }

    // TODO: move this stuff to getSubject method in Message.ts

    let additionalInfo: string = ''
    try {
      const messageBodyType: MessageBodyType | undefined = message.body.type

      switch (messageBodyType) {
        case MessageBodyType.REQUEST_CLAIM_FOR_CTYPE:
          additionalInfo = (message.body as RequestClaimForCtype).content.name
          break
        case MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
          break
        case MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM:
          break
        case MessageBodyType.SUBMIT_CLAIM_FOR_CTYPE:
          break
      }
    } catch (error) {
      additionalInfo = ''
    }

    return (
      <span>
        <span className="type">{message.body!.type}</span>
        {additionalInfo && <span> "{additionalInfo}"</span>}
      </span>
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
