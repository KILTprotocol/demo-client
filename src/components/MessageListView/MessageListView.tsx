import * as React from 'react'

import {
  ApproveAttestationForClaim,
  Message,
  MessageBodyType,
  RequestAttestationForClaim,
  RequestClaimForCtype,
  SubmitClaimForCtype,
} from '../../types/Message'

import './MessageListView.scss'

type Props = {
  messages: Message[]
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
                      {this.getMessageInfo(message)}
                    </div>
                  </td>
                  <td className="actions">
                    <button
                      className="delete"
                      onClick={this.handleDelete(message)}
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

  private getMessageInfo(message: Message) {
    if (!message || !message.body || !message.body.content) {
      return undefined
    }

    if (!message.body || !message.body.type) {
      return message.message
    }

    let additionalInfo: string = ''
    try {
      const messageBodyType: MessageBodyType | undefined = message.body.type

      switch (messageBodyType) {
        case MessageBodyType.REQUEST_CLAIM_FOR_CTYPE:
          additionalInfo = (message.body as RequestClaimForCtype).content.name
          break
        case MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
          additionalInfo = (message.body as RequestAttestationForClaim).content
            .alias
          break
        case MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM:
          additionalInfo = (message.body as ApproveAttestationForClaim).content
            .claim.owner
          break
        case MessageBodyType.SUBMIT_CLAIM_FOR_CTYPE:
          additionalInfo = (message.body as SubmitClaimForCtype).content.claim
            .owner
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
