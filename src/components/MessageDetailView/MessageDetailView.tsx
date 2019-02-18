import React, { ReactNode } from 'react'

import {
  Message,
  MessageBodyType,
  RequestClaimsForCtype,
  RequestAttestationForClaim,
  ApproveAttestationForClaim,
  SubmitClaimsForCtype,
  RequestLegitimations,
  SubmitLegitimations,
} from '../../types/Message'
import Code from '../Code/Code'
import ChooseClaimsForCType from '../../containers/workflows/ChooseClaimsForCtype/ChooseClaimsForCtype'
import AttestClaim from '../../containers/workflows/AttestClaim/AttestClaim'
import ImportAttestation from '../../containers/workflows/ImportAttestation/ImportAttestation'
import VerifyClaim from '../../containers/workflows/VerifyClaim/VerifyClaim'
import './MessageDetailView.scss'

type Props = {
  message: Message
  onDelete: (message: Message) => void
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
        {this.shouldDisplayContentAsCode(message) && (
          <div>
            Contents:{' '}
            {message.body ? (
              <Code>{message.body.content}</Code>
            ) : (
              message.message
            )}
          </div>
        )}
        <div className="workflow">{this.getWorkflow(message)}</div>
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

  private getWorkflow(message: Message): ReactNode | undefined {
    if (!message || !message.body || !message.body.content) {
      return undefined
    }

    const messageBodyType:
      | MessageBodyType
      | undefined = this.getMessageBodyType(message)

    switch (messageBodyType) {
      case MessageBodyType.REQUEST_CLAIMS_FOR_CTYPE:
        return (
          <ChooseClaimsForCType
            senderAddress={message.senderAddress}
            cTypeHash={
              (message.body as RequestClaimsForCtype).content.cType.hash
            }
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.REQUEST_LEGITIMATIONS:
        return (
          <ChooseClaimsForCType
            senderAddress={message.senderAddress}
            sentClaim={(message.body as RequestLegitimations).content}
            cTypeHash={(message.body as RequestLegitimations).content.cType}
            onFinished={this.handleDelete}
            context="legitimation"
          />
        )
      case MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
        return (
          <AttestClaim
            senderAddress={message.senderAddress}
            requestForAttestation={
              (message.body as RequestAttestationForClaim).content
            }
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM:
        return (
          <ImportAttestation
            attestedClaim={(message.body as ApproveAttestationForClaim).content}
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE:
        return (
          <VerifyClaim
            attestedClaims={(message.body as SubmitClaimsForCtype).content}
          />
        )
      case MessageBodyType.SUBMIT_LEGITIMATIONS:
        return (
          <VerifyClaim
            attestedClaims={
              (message.body as SubmitLegitimations).content.legitimations
            }
            context="legitimation"
          />
        )
      default:
        return undefined
    }
  }

  private handleDelete() {
    const { message, onDelete } = this.props
    if (message && onDelete) {
      onDelete(message)
    }
  }

  private handleCancel() {
    const { message, onCancel } = this.props
    if (message && message.messageId && onCancel) {
      onCancel(message.messageId)
    }
  }

  private getMessageBodyType(message: Message): MessageBodyType | undefined {
    return message && message.body && message.body.type
  }

  private shouldDisplayContentAsCode(message: Message): boolean {
    const messageBodyType:
      | MessageBodyType
      | undefined = this.getMessageBodyType(message)

    return (
      messageBodyType !== undefined &&
      messageBodyType !== MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE
    )
  }
}

export default MessageDetailView
