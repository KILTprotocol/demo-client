import * as sdk from '@kiltprotocol/prototype-sdk'
import React, { ReactNode } from 'react'
import AcceptDelegation from '../../containers/workflows/AcceptDelegation/AcceptDelegation'
import AttestClaim from '../../containers/workflows/AttestClaim/AttestClaim'
import CreateDelegation from '../../containers/workflows/CreateDelegation/CreateDelegation'
import ImportAttestation from '../../containers/workflows/ImportAttestation/ImportAttestation'
import OnRequestClaimsForCType from '../../containers/workflows/OnRequestClaimsForCType/OnRequestClaimsForCType'
import OnRequestLegitimations from '../../containers/workflows/OnRequestLegitimations/OnRequestLegitimations'
import RequestAttestation from '../../containers/workflows/RequestAttestation/RequestAttestation'
import RequestLegitimations from '../../containers/workflows/RequestLegitimations/RequestLegitimations'
import SelectAttestedClaims from '../../containers/workflows/OnRequestClaimsForCType/OnRequestClaimsForCType'
import VerifyClaim from '../../containers/workflows/VerifyClaim/VerifyClaim'
import { MessageOutput } from '../../services/MessageRepository'

import Code from '../Code/Code'
import MessageSubject from '../MessageSubject/MessageSubject'

import './MessageDetailView.scss'
import ImportDelegation from 'src/containers/workflows/ImportDelegation/ImportDelegation'

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
          <OnRequestLegitimations
            senderAddress={message.senderAddress}
            sentClaim={(message.body as sdk.IRequestLegitimations).content}
            onFinished={this.handleDelete}
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
          <OnRequestClaimsForCType
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
      case sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION: {
        const messageContent = (message.body as sdk.IRequestAcceptDelegation)
          .content
        return (
          <AcceptDelegation
            delegationData={messageContent.delegationData}
            signatures={messageContent.signatures}
            inviterAddress={message.senderAddress}
            metaData={messageContent.metaData}
            onFinished={this.handleDelete}
          />
        )
      }
      case sdk.MessageBodyType.SUBMIT_ACCEPT_DELEGATION: {
        const messageContent = (message.body as sdk.ISubmitAcceptDelegation)
          .content
        return (
          <CreateDelegation
            delegationData={messageContent.delegationData}
            signatures={messageContent.signatures}
            inviteeAddress={message.senderAddress}
            inviterAddress={message.receiverAddress}
            onFinished={this.handleDelete}
          />
        )
      }
      case sdk.MessageBodyType.INFORM_CREATE_DELEGATION: {
        const delegationId = (message.body as sdk.IInformCreateDelegation)
          .content
        return (
          <ImportDelegation
            delegationId={delegationId}
            onFinished={this.handleDelete}
          />
        )
      }
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

    return messageBodyType !== undefined
  }
}

export default MessageDetailView
