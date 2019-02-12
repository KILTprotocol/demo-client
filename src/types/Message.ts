import * as sdk from '@kiltprotocol/prototype-sdk'
import { Contact } from './Contact'

import { ICType } from './Ctype'

export interface Message {
  body?: MessageBody
  messageId?: string
  message: string
  nonce: string
  receiverAddress: Contact['publicIdentity']['address']
  senderAddress: Contact['publicIdentity']['address']
}

export interface MessageOutput extends Message {
  sender?: Contact
}

export enum MessageBodyType {
  REQUEST_LEGITIMATIONS = 'request-legitimations',
  SUBMIT_LEGITIMATIONS = 'submit-legitimations',
  REQUEST_ATTESTATION_FOR_CLAIM = 'request-attestation-for-claim',
  APPROVE_ATTESTATION_FOR_CLAIM = 'approve-attestation-for-claim',
  REQUEST_CLAIM_FOR_CTYPE = 'request-claim-for-ctype',
  SUBMIT_CLAIM_FOR_CTYPE = 'submit-claim-for-ctype',
}

interface MessageBodyBase {
  content: any
  type: MessageBodyType
}

export interface RequestLegitimations extends MessageBodyBase {
  content: Partial<sdk.Claim>
  type: MessageBodyType.REQUEST_LEGITIMATIONS
}

export interface SubmitLegitimations extends MessageBodyBase {
  content: {
    claim: Partial<sdk.Claim>
    legitimations: sdk.IAttestedClaim[]
  }
  type: MessageBodyType.SUBMIT_LEGITIMATIONS
}

export interface RequestAttestationForClaim extends MessageBodyBase {
  content: sdk.IRequestForAttestation
  type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM
}

export interface ApproveAttestationForClaim extends MessageBodyBase {
  content: sdk.IAttestedClaim
  type: MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM
}

export interface RequestClaimForCtype extends MessageBodyBase {
  content: ICType
  type: MessageBodyType.REQUEST_CLAIM_FOR_CTYPE
}

export interface SubmitClaimForCtype extends MessageBodyBase {
  content: sdk.IAttestedClaim[]
  type: MessageBodyType.SUBMIT_CLAIM_FOR_CTYPE
}

export type MessageBody =
  | RequestLegitimations
  | SubmitLegitimations
  | RequestAttestationForClaim
  | ApproveAttestationForClaim
  | RequestClaimForCtype
  | SubmitClaimForCtype
