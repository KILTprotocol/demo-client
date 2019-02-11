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
  REQUEST_LEGITIMATIONS_FOR_CLAIM_ATTESTATION = 'request-legitimation-for-claim-attestation',
  SUBMIT_LEGITIMATIONS_FOR_CLAIM_ATTESTATION = 'submit-legitimation-for-claim-attestation',
  REQUEST_ATTESTATION_FOR_CLAIM = 'request-attestation-for-claim',
  APPROVE_ATTESTATION_FOR_CLAIM = 'approve-attestation-for-claim',
  REQUEST_CLAIM_FOR_CTYPE = 'request-claim-for-ctype',
  SUBMIT_CLAIM_FOR_CTYPE = 'submit-claim-for-ctype',
}

interface MessageBodyBase {
  content: any
  type: MessageBodyType
}

export interface RequestLegitimationsForClaimAttestation
  extends MessageBodyBase {
  content: sdk.IClaim
  type: MessageBodyType.REQUEST_LEGITIMATIONS_FOR_CLAIM_ATTESTATION
}

export interface SubmitLegitimationsForClaimAttestation
  extends MessageBodyBase {
  content: {
    claim: sdk.IClaim
    legitimations: sdk.IAttestedClaim[]
  }
  type: MessageBodyType.SUBMIT_LEGITIMATIONS_FOR_CLAIM_ATTESTATION
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
  | RequestLegitimationsForClaimAttestation
  | SubmitLegitimationsForClaimAttestation
  | RequestAttestationForClaim
  | ApproveAttestationForClaim
  | RequestClaimForCtype
  | SubmitClaimForCtype
