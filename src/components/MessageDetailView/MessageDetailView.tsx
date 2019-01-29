import React, { ReactNode } from 'react'

import {
  Message,
  MessageBodyType,
  RequestClaimForCtype,
  RequestAttestationForClaim,
  ClaimMessageBodyContent,
  ApproveAttestationForClaim,
  SubmitClaimForCtype,
} from '../../types/Message'
import Code from '../Code/Code'
import ChooseClaimForCtype from '../../containers/workflows/ChooseClaimForCtype/ChooseClaimForCtype'
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
        <div className="workflow">{this.buildWorkflow(message)}</div>
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

  private getWorkflow(): ReactNode | undefined {
    const { message } = this.props

    if (!message || !message.body || !message.body.content) {
      return undefined
    }

    const messageBodyType: MessageBodyType | undefined =
      message && message.body && message.body.type

    switch (messageBodyType) {
      case MessageBodyType.REQUEST_CLAIM_FOR_CTYPE:
        return (
          <ChooseClaimForCtype
            senderAddress={message.senderAddress}
            ctypeKey={(message.body as RequestClaimForCtype).content.key}
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
        return (
          <AttestClaim
            senderAddress={message.senderAddress}
            claim={
              ((message.body as RequestAttestationForClaim)
                .content as ClaimMessageBodyContent).claim
            }
            ctypeName={
              ((message.body as RequestAttestationForClaim)
                .content as ClaimMessageBodyContent).cType.name
            }
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM:
        return (
          <ImportAttestation
            claim={(message.body as ApproveAttestationForClaim).content.claim}
            attestation={
              (message.body as ApproveAttestationForClaim).content.attestation
            }
            onFinished={this.handleDelete}
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

  private buildWorkflow(message: Message): ReactNode | undefined {
    if (!message || !message.body || !message.body.content) {
      return undefined
    }

    const messageBodyType:
      | MessageBodyType
      | undefined = this.getMessageBodyType(message)

    switch (messageBodyType) {
      case MessageBodyType.REQUEST_CLAIM_FOR_CTYPE:
        return (
          <ChooseClaimForCtype
            senderKey={message.senderKey}
            ctypeKey={(message.body as RequestClaimForCtype).content.key}
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
        return (
          <AttestClaim
            senderKey={message.senderKey}
            claim={
              ((message.body as RequestAttestationForClaim)
                .content as ClaimMessageBodyContent).claim
            }
            ctypeName={
              ((message.body as RequestAttestationForClaim)
                .content as ClaimMessageBodyContent).cType.name
            }
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM:
        return (
          <ImportAttestation
            claim={(message.body as ApproveAttestationForClaim).content.claim}
            attestation={
              (message.body as ApproveAttestationForClaim).content.attestation
            }
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.SUBMIT_CLAIM_FOR_CTYPE:
        return (
          <VerifyClaim
            claim={(message.body as SubmitClaimForCtype).content.claim}
            attestations={
              (message.body as SubmitClaimForCtype).content.attestations
            }
          />
        )
      default:
        return undefined
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
      messageBodyType !== MessageBodyType.SUBMIT_CLAIM_FOR_CTYPE
    )
  }
}

export default MessageDetailView
