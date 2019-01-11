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

export type MessageBodyType =
  | 'request-attestation-for-claim'
  | 'approve-attestation-for-claim'
  | 'request-claim-for-ctype'

interface MessageBodyBase {
  content: Claims.Entry | CType['key']
  type: MessageBodyType
}

export interface RequestAttestationForClaim extends MessageBodyBase {
  content: Claims.Entry
  type: 'request-attestation-for-claim'
}

export interface ApproveAttestationForClaim extends MessageBodyBase {
  content: Claims.Entry
  type: 'approve-attestation-for-claim'
}

export interface RequestClaimForCtype extends MessageBodyBase {
  content: CType['key']
  type: 'request-claim-for-ctype'
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
