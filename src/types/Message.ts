import * as Claims from '../state/ducks/Claims'
import { CType } from './Ctype'

export type Message = {
  id?: string
  sender: string
  senderKey: string
  senderEncryptionKey: string
  receiverKey: string
  message: string
  nonce: string
  body?: MessageBody
}

export enum MessageBodyType {
  REQUEST_ATTESTATION_FOR_CLAIM,
  APPROVE_ATTESTATION_FOR_CLAIM,
  REQUEST_CLAIM_FOR_CTYPE,
}

interface MessageBodyBase {
  content: Claims.Entry | CType['key']
  type: MessageBodyType
}

export interface RequestAttestationForClaim extends MessageBodyBase {
  content: Claims.Entry
  type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM
}

export interface ApproveAttestationForClaim extends MessageBodyBase {
  content: Claims.Entry
  type: MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM
}

export interface RequestClaimForCtype extends MessageBodyBase {
  content: CType['key']
  type: MessageBodyType.REQUEST_CLAIM_FOR_CTYPE
}

export type MessageBody =
  | RequestAttestationForClaim
  | ApproveAttestationForClaim
  | RequestClaimForCtype

// attempt for some systematic for message message type
// interface _MessageBodyType {
//   intent: 'request' | 'approve' | 'decline' | 'revoke'
//   action: 'attestation' | 'verification' | 'claim'
//   for: 'claim' | 'ctype'
// }
//
// interface RequestAttestationClaim extends _MessageBodyType {
//   intent: 'request'
//   action: 'attestation'
//   for: 'claim'
// }
//
// interface ApproveAttestationClaim extends _MessageBodyType {
//   intent: 'approve'
//   action: 'attestation'
//   for: 'claim'
// }
