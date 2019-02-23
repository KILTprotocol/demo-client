import React, { ReactNode } from 'react'

import Code from '../Code/Code'
import ChooseClaimsForCType from '../../containers/workflows/ChooseClaimsForCtype/ChooseClaimsForCtype'
import AttestClaim from '../../containers/workflows/AttestClaim/AttestClaim'
import ImportAttestation from '../../containers/workflows/ImportAttestation/ImportAttestation'
import VerifyClaim from '../../containers/workflows/VerifyClaim/VerifyClaim'
import MessageSubject from '../MessageSubject/MessageSubject'

import './MessageDetailView.scss'
import {
  IMessage,
  IRequestAttestationForClaim,
  IRequestClaimsForCtype,
  IRequestLegitimations,
  ISubmitAttestationForClaim,
  ISubmitClaimsForCtype,
  ISubmitLegitimations,
  MessageBodyType,
} from '@kiltprotocol/prototype-sdk'

type Props = {
  message: IMessage
  onDelete: (message: IMessage) => void
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
        <h4>
          Subject: <MessageSubject message={message} />
        </h4>
        {this.shouldDisplayContentAsCode(message) && (
          <div>
            Contents:{' '}
            {message.body ? <Code>{message.body.content}</Code> : message.body}
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

  private getWorkflow(message: IMessage): ReactNode | undefined {
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
            cTypeHash={(message.body as IRequestClaimsForCtype).content}
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.REQUEST_LEGITIMATIONS:
        return (
          <ChooseClaimsForCType
            senderAddress={message.senderAddress}
            sentClaim={(message.body as IRequestLegitimations).content}
            cTypeHash={(message.body as IRequestLegitimations).content.cType}
            onFinished={this.handleDelete}
            context="legitimation"
          />
        )
      case MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
        return (
          <AttestClaim
            senderAddress={message.senderAddress}
            requestForAttestation={
              (message.body as IRequestAttestationForClaim).content
            }
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM:
        return (
          <ImportAttestation
            attestedClaim={(message.body as ISubmitAttestationForClaim).content}
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE:
        return (
          <VerifyClaim
            attestedClaims={(message.body as ISubmitClaimsForCtype).content}
          />
        )
      case MessageBodyType.SUBMIT_LEGITIMATIONS:
        return (
          <VerifyClaim
            attestedClaims={
              (message.body as ISubmitLegitimations).content.legitimations
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

  private getMessageBodyType(message: IMessage): MessageBodyType | undefined {
    return message && message.body && message.body.type
  }

  private shouldDisplayContentAsCode(message: IMessage): boolean {
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
