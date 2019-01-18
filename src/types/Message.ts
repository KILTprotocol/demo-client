import * as sdk from '@kiltprotocol/prototype-sdk'

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
  REQUEST_ATTESTATION_FOR_CLAIM = 'request-attestation-for-claim',
  APPROVE_ATTESTATION_FOR_CLAIM = 'approve-attestation-for-claim',
  REQUEST_CLAIM_FOR_CTYPE = 'request-claim-for-ctype',
}

interface MessageBodyBase {
  content: sdk.IClaim | sdk.IAttestation | CType
  type: MessageBodyType
}

export interface RequestAttestationForClaim extends MessageBodyBase {
  content: sdk.IClaim
  type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM
}

export interface ApproveAttestationForClaim extends MessageBodyBase {
  content: sdk.IAttestation
  type: MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM
}

export interface RequestClaimForCtype extends MessageBodyBase {
  content: CType
  type: MessageBodyType.REQUEST_CLAIM_FOR_CTYPE
}

export type MessageBody =
  | RequestAttestationForClaim
  | ApproveAttestationForClaim
  | RequestClaimForCtype
