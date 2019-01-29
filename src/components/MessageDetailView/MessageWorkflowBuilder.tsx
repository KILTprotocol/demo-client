import {
  Message,
  MessageBodyType,
  RequestClaimForCtype,
  RequestAttestationForClaim,
  ClaimMessageBodyContent,
  ApproveAttestationForClaim,
  SubmitClaimForCtype,
} from 'src/types/Message'
import { ReactNode } from 'react'
import React from 'react'
import AttestClaim from '../../containers/workflows/AttestClaim/AttestClaim'
import ChooseClaimForCtype from '../../containers/workflows/ChooseClaimForCtype/ChooseClaimForCtype'
import ImportAttestation from '../../containers/workflows/ImportAttestation/ImportAttestation'
import VerifyClaim from '../../containers/workflows/VerifyClaim/VerifyClaim'

class MessageWorkflowBuilder {
  public static fromMessage(
    message: Message,
    onFinished?: () => void
  ): ReactNode | undefined {
    if (!message || !message.body || !message.body.content) {
      return undefined
    }

    const messageBodyType:
      | MessageBodyType
      | undefined = MessageWorkflowBuilder.getMessageBodyType(message)

    switch (messageBodyType) {
      case MessageBodyType.REQUEST_CLAIM_FOR_CTYPE:
        return (
          <ChooseClaimForCtype
            senderKey={message.senderKey}
            ctypeKey={(message.body as RequestClaimForCtype).content.key}
            onFinished={onFinished}
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
            onFinished={onFinished}
          />
        )
      case MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM:
        return (
          <ImportAttestation
            claim={(message.body as ApproveAttestationForClaim).content.claim}
            attestation={
              (message.body as ApproveAttestationForClaim).content.attestation
            }
            onFinished={onFinished}
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

  public static getMessageBodyType(
    message: Message
  ): MessageBodyType | undefined {
    return message && message.body && message.body.type
  }

  public static shouldDisplayContentAsCode(message: Message): boolean {
    const messageBodyType:
      | MessageBodyType
      | undefined = MessageWorkflowBuilder.getMessageBodyType(message)

    return (
      messageBodyType !== undefined &&
      messageBodyType !== MessageBodyType.SUBMIT_CLAIM_FOR_CTYPE
    )
  }
}

export default MessageWorkflowBuilder
