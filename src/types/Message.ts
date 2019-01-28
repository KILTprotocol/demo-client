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
  SUBMIT_CLAIM_FOR_CTYPE = 'submit-claim-for-ctype',
}

interface MessageBodyBase {
  content: any
  type: MessageBodyType
}

export interface RequestAttestationForClaim extends MessageBodyBase {
  content: ClaimMessageBodyContent
  type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM
}

export interface ApproveAttestationForClaim extends MessageBodyBase {
  content: {
    claim: sdk.IClaim
    attestation: sdk.IAttestation
  }
  type: MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM
}

export interface RequestClaimForCtype extends MessageBodyBase {
  content: CType
  type: MessageBodyType.REQUEST_CLAIM_FOR_CTYPE
}

export interface SubmitClaimForCtype extends MessageBodyBase {
  content: { claim: sdk.IClaim; attestations: sdk.IAttestation[] }
  type: MessageBodyType.SUBMIT_CLAIM_FOR_CTYPE
}

export type MessageBody =
  | RequestAttestationForClaim
  | ApproveAttestationForClaim
  | RequestClaimForCtype
  | SubmitClaimForCtype

export interface ClaimMessageBodyContent {
  claim: sdk.IClaim
  cType: {
    name: string
  }
}
