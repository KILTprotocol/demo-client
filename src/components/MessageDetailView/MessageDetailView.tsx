import * as sdk from '@kiltprotocol/prototype-sdk'
import React, { ReactNode } from 'react'
import AttestClaim from '../../containers/workflows/AttestClaim/AttestClaim'
import ImportAttestation from '../../containers/workflows/ImportAttestation/ImportAttestation'
import RequestAttestation from '../../containers/workflows/RequestAttestation/RequestAttestation'
import SelectAttestedClaims from '../../containers/workflows/SelectAttestedClaims/SelectAttestedClaims'
import VerifyClaim from '../../containers/workflows/VerifyClaim/VerifyClaim'
import { MessageOutput } from '../../services/MessageRepository'

import Code from '../Code/Code'
import MessageSubject from '../MessageSubject/MessageSubject'

import './MessageDetailView.scss'

type Props = {
  message: MessageOutput
  onDelete: (message: MessageOutput) => void
  onCancel: (id: string) => void
}

type State = {
  showCode: boolean
  selectedCode: 'encrypted' | 'decrypted'
}

class MessageDetailView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      selectedCode: 'decrypted',
      showCode: true,
    }
    this.handleDelete = this.handleDelete.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
    this.toggleShowCode = this.toggleShowCode.bind(this)
    this.selectCode = this.selectCode.bind(this)
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

  private getCode(message: MessageOutput) {
    const { selectedCode, showCode } = this.state
    const { sender, encryptedMessage, ...decryptedMessage } = message
    return (
      showCode && (
        <div className={`code ${selectedCode}`}>
          <div className="code-tabs">
            <div
              className="decrypted"
              onClick={this.selectCode.bind(this, 'decrypted')}
            >
              Decrypted Message
            </div>
            <div
              className="encrypted"
              onClick={this.selectCode.bind(this, 'encrypted')}
            >
              Encrypted Message
            </div>
          </div>
          {selectedCode === 'decrypted' && <Code>{decryptedMessage}</Code>}
          {selectedCode === 'encrypted' && <Code>{encryptedMessage}</Code>}
        </div>
      )
    )
  }

  private selectCode(requestedCode: State['selectedCode']) {
    this.setState({
      selectedCode: requestedCode,
    })
  }

  private getWorkflow(message: MessageOutput): ReactNode | undefined {
    if (!message || !message.body || !message.body.content) {
      return undefined
    }

    const messageBodyType:
      | sdk.MessageBodyType
      | undefined = this.getMessageBodyType(message)

    switch (messageBodyType) {
      case sdk.MessageBodyType.REQUEST_LEGITIMATIONS:
        return (
          <SelectAttestedClaims
            senderAddress={message.senderAddress}
            sentClaim={(message.body as sdk.IRequestLegitimations).content}
            onFinished={this.handleDelete}
            context="legitimation"
          />
        )
      case sdk.MessageBodyType.SUBMIT_LEGITIMATIONS:
        return (
          <RequestAttestation
            initialClaim={
              (message.body as sdk.ISubmitLegitimations).content.claim
            }
            legitimations={
              (message.body as sdk.ISubmitLegitimations).content.legitimations
            }
            attesterAddress={message.senderAddress}
            onFinished={this.handleDelete}
          />
        )
      case sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
        return (
          <AttestClaim
            senderAddress={message.senderAddress}
            requestForAttestation={
              (message.body as sdk.IRequestAttestationForClaim).content
            }
            onFinished={this.handleDelete}
          />
        )
      case sdk.MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM:
        return (
          <ImportAttestation
            attestedClaim={
              (message.body as sdk.ISubmitAttestationForClaim).content
            }
            onFinished={this.handleDelete}
          />
        )
      case sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPE:
        return (
          <SelectAttestedClaims
            senderAddress={message.senderAddress}
            cTypeHash={(message.body as sdk.IRequestClaimsForCtype).content}
            onFinished={this.handleDelete}
          />
        )
      case sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE:
        return (
          <VerifyClaim
            attestedClaims={(message.body as sdk.ISubmitClaimsForCtype).content}
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

  private getMessageBodyType(
    message: MessageOutput
  ): sdk.MessageBodyType | undefined {
    return message && message.body && message.body.type
  }

  private canDisplayContentAsCode(message: MessageOutput): boolean {
    const messageBodyType:
      | sdk.MessageBodyType
      | undefined = this.getMessageBodyType(message)

    return (
      messageBodyType !== undefined &&
      messageBodyType !== sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE
    )
  }
}

export default MessageDetailView
