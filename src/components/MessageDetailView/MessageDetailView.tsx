import * as sdk from '@kiltprotocol/sdk-js'
import React, { ReactNode } from 'react'

import AcceptDelegation from '../../containers/Tasks/AcceptDelegation/AcceptDelegation'
import AttestClaim from '../../containers/Tasks/AttestClaim/AttestClaim'
import CreateDelegation from '../../containers/Tasks/CreateDelegation/CreateDelegation'
import ImportAttestation from '../../containers/Tasks/ImportAttestation/ImportAttestation'
import SubmitClaimsForCType from '../../containers/Tasks/SubmitClaimsForCType/SubmitClaimsForCType'
import SubmitLegitimations from '../../containers/Tasks/SubmitLegitimations/SubmitLegitimations'
import RequestAttestation from '../../containers/Tasks/RequestAttestation/RequestAttestation'
import VerifyClaim from '../../containers/Tasks/VerifyClaim/VerifyClaim'
import { IMessageOutput } from '../../services/MessageRepository'
import ClaimDetailView from '../ClaimDetailView/ClaimDetailView'
import Code from '../Code/Code'
import MessageSubject from '../MessageSubject/MessageSubject'
import ImportDelegation from '../../containers/Tasks/ImportDelegation/ImportDelegation'

import './MessageDetailView.scss'

type Props = {
  message: IMessageOutput
  onDelete: (message: IMessageOutput) => void
  onCancel: (id: string) => void
}

type State = {
  selectedCode: 'encrypted' | 'decrypted'
  showCode: boolean
  showTask: boolean
}

class MessageDetailView extends React.Component<Props, State> {
  private static canDisplayContentAsCode(message: IMessageOutput): boolean {
    const messageBodyType:
      | sdk.MessageBodyType
      | undefined = MessageDetailView.getMessageBodyType(message)

    return messageBodyType !== undefined
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      selectedCode: 'decrypted',
      showCode: true,
      showTask: false,
    }
    this.handleDelete = this.handleDelete.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
    this.toggleShowCode = this.toggleShowCode.bind(this)
    this.toggleShowTask = this.toggleShowTask.bind(this)
    this.selectCode = this.selectCode.bind(this)
  }

  private getCode(message: IMessageOutput): false | JSX.Element {
    const { selectedCode, showCode } = this.state
    const { encryptedMessage, ...decryptedMessage } = message
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

  private getTask(message: IMessageOutput): ReactNode | undefined {
    if (!message || !message.body || !message.body.content) {
      return undefined
    }

    const messageBodyType:
      | sdk.MessageBodyType
      | undefined = MessageDetailView.getMessageBodyType(message)

    switch (messageBodyType) {
      case sdk.MessageBodyType.REQUEST_LEGITIMATIONS: {
        const { showTask } = this.state

        return (
          <>
            <ClaimDetailView
              claim={(message.body as sdk.IRequestLegitimations).content}
            />
            {showTask ? (
              <SubmitLegitimations
                receiverAddresses={[message.senderAddress]}
                claim={(message.body as sdk.IRequestLegitimations).content}
                onCancel={this.handleCancel}
                onFinished={this.handleDelete}
              />
            ) : (
              <div className="actions">
                <button type="button" onClick={this.toggleShowTask}>
                  Select legitimation(s)
                </button>
              </div>
            )}
          </>
        )
      }
      case sdk.MessageBodyType.SUBMIT_LEGITIMATIONS: {
        return (
          <RequestAttestation
            claim={(message.body as sdk.ISubmitLegitimations).content.claim}
            legitimations={
              (message.body as sdk.ISubmitLegitimations).content.legitimations
            }
            delegationId={
              (message.body as sdk.ISubmitLegitimations).content.delegationId
            }
            receiverAddresses={[message.senderAddress]}
            onCancel={this.handleCancel}
            onFinished={this.handleDelete}
          />
        )
      }
      case sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM: {
        return (
          <AttestClaim
            claimerAddresses={[message.senderAddress]}
            requestForAttestation={
              (message.body as sdk.IRequestAttestationForClaim).content
            }
            onCancel={this.handleCancel}
            onFinished={this.handleDelete}
          />
        )
      }
      case sdk.MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM: {
        return (
          <ImportAttestation
            attestedClaim={
              (message.body as sdk.ISubmitAttestationForClaim).content
            }
            onCancel={this.handleCancel}
            onFinished={this.handleDelete}
          />
        )
      }
      case sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES: {
        return (
          <SubmitClaimsForCType
            receiverAddresses={[message.senderAddress]}
            cTypeHashes={(message.body as sdk.IRequestClaimsForCTypes).content}
            onCancel={this.handleCancel}
            onFinished={this.handleDelete}
          />
        )
      }
      case sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES: {
        return (
          <VerifyClaim
            attestedClaims={
              (message.body as sdk.ISubmitClaimsForCTypes).content
            }
          />
        )
      }
      case sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION: {
        const messageContent = (message.body as sdk.IRequestAcceptDelegation)
          .content
        return (
          <AcceptDelegation
            delegationData={messageContent.delegationData}
            signatures={messageContent.signatures}
            inviterAddress={message.senderAddress}
            metaData={messageContent.metaData}
            onCancel={this.handleCancel}
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
            onCancel={this.handleCancel}
            onFinished={this.handleDelete}
          />
        )
      }
      case sdk.MessageBodyType.INFORM_CREATE_DELEGATION: {
        const {
          delegationId,
          isPCR,
        } = (message.body as sdk.IInformCreateDelegation).content
        return (
          <ImportDelegation
            delegationId={delegationId}
            isPCR={isPCR}
            onCancel={this.handleCancel}
            onFinished={this.handleDelete}
          />
        )
      }
      default:
        return undefined
    }
  }

  private static getMessageBodyType(
    message: IMessageOutput
  ): sdk.MessageBodyType | undefined {
    return message && message.body && message.body.type
  }

  private selectCode(requestedCode: State['selectedCode']): void {
    this.setState({
      selectedCode: requestedCode,
    })
  }

  private handleDelete(): void {
    const { message, onDelete } = this.props
    if (message && onDelete) {
      setTimeout(() => {
        onDelete(message)
      })
    }
  }

  private handleCancel(): void {
    const { message, onCancel } = this.props
    if (message && message.messageId && onCancel) {
      onCancel(message.messageId)
    }
  }

  private toggleShowCode(): void {
    const { showCode } = this.state
    this.setState({
      showCode: !showCode,
    })
  }

  private toggleShowTask(): void {
    const { showTask } = this.state
    this.setState({
      showTask: !showTask,
    })
  }

  public render(): JSX.Element {
    const { message } = this.props
    return (
      <section className="MessageDetailView">
        <h4>
          <span>
            Subject: <MessageSubject message={message} />
          </span>
          {MessageDetailView.canDisplayContentAsCode(message) && (
            <button
              type="button"
              className="toggle-code"
              onClick={this.toggleShowCode}
            />
          )}
        </h4>
        {MessageDetailView.canDisplayContentAsCode(message) &&
          this.getCode(message)}
        <section className="Task">{this.getTask(message)}</section>
      </section>
    )
  }
}

export default MessageDetailView
