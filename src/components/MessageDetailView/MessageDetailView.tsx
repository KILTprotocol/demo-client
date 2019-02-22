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
import React, { ReactNode } from 'react'
import AttestClaim from '../../containers/workflows/AttestClaim/AttestClaim'
import ImportAttestation from '../../containers/workflows/ImportAttestation/ImportAttestation'
import RequestAttestation from '../../containers/workflows/RequestAttestation/RequestAttestation'
import SelectAttestedClaims from '../../containers/workflows/SelectAttestedClaims/SelectAttestedClaims'
import VerifyClaim from '../../containers/workflows/VerifyClaim/VerifyClaim'

import Code from '../Code/Code'
import MessageSubject from '../MessageSubject/MessageSubject'

import './MessageDetailView.scss'

type Props = {
  message: IMessage
  onDelete: (message: IMessage) => void
  onCancel: (id: string) => void
}

type State = {
  showCode: boolean
}

class MessageDetailView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      showCode: false,
    }
    this.handleDelete = this.handleDelete.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
    this.toggleShowCode = this.toggleShowCode.bind(this)
  }

  public render() {
    const { message, children } = this.props
    return (
      <section className="MessageDetailView">
        <h4>
          <span>
            Subject: <MessageSubject message={message} />
          </span>
          {this.canDisplayContentAsCode(message) && (
            <button className="toggle-code" onClick={this.toggleShowCode} />
          )}
        </h4>
        {this.canDisplayContentAsCode(message) && this.getCode(message)}
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

  private getCode(message: Message) {
    const { showCode } = this.state
    return (
      showCode && (
        <div className="code">
          <div>Source:</div>
          {message.body ? (
            <Code>{message.body!.content}</Code>
          ) : (
            message.message
          )}
        </div>
      )
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
      case MessageBodyType.REQUEST_LEGITIMATIONS:
        return (
          <SelectAttestedClaims
            senderAddress={message.senderAddress}
            sentClaim={(message.body as IRequestLegitimations).content}
            cTypeHash={(message.body as IRequestLegitimations).content.cType}
            onFinished={this.handleDelete}
            context="legitimation"
          />
        )
      case MessageBodyType.SUBMIT_LEGITIMATIONS:
        return (
          <RequestAttestation
            initialClaim={(message.body as ISubmitLegitimations).content.claim}
            legitimations={
              (message.body as ISubmitLegitimations).content.legitimations
            }
            attesterAddress={message.senderAddress}
            onFinished={this.handleDelete}
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
      case MessageBodyType.REQUEST_CLAIMS_FOR_CTYPE:
        return (
          <SelectAttestedClaims
            senderAddress={message.senderAddress}
            cTypeHash={(message.body as IRequestClaimsForCtype).content}
            onFinished={this.handleDelete}
          />
        )
      case MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE:
        return (
          <VerifyClaim
            attestedClaims={(message.body as ISubmitClaimsForCtype).content}
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

  private toggleShowCode() {
    const { showCode } = this.state
    this.setState({
      showCode: !showCode,
    })
  }

  private getMessageBodyType(message: IMessage): MessageBodyType | undefined {
    return message && message.body && message.body.type
  }

  private canDisplayContentAsCode(message: IMessage): boolean {
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
