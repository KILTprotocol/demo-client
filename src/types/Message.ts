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
  REQUEST_CLAIMS_FOR_CTYPE = 'request-claims-for-ctype',
  SUBMIT_CLAIMS_FOR_CTYPE = 'submit-claims-for-ctype',
}

interface MessageBodyBase {
  content: any
  type: MessageBodyType
}

export interface RequestLegitimations extends MessageBodyBase {
  content: PartialClaim
  type: MessageBodyType.REQUEST_LEGITIMATIONS
}

export interface SubmitLegitimations extends MessageBodyBase {
  content: {
    claim: PartialClaim
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

export interface RequestClaimsForCtype extends MessageBodyBase {
  content: ICType
  type: MessageBodyType.REQUEST_CLAIMS_FOR_CTYPE
}

export interface SubmitClaimsForCtype extends MessageBodyBase {
  content: sdk.IAttestedClaim[]
  type: MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE
}

export interface PartialClaim extends Partial<sdk.IClaim> {
  cType: sdk.Claim['cType']
}

export type MessageBody =
  | RequestLegitimations
  | SubmitLegitimations
  | RequestAttestationForClaim
  | ApproveAttestationForClaim
  | RequestClaimsForCtype
  | SubmitClaimsForCtype
