import { Identity, PublicIdentity } from '@kiltprotocol/sdk-js'
import { IDidDocumentSigned } from '@kiltprotocol/sdk-js/build/did/Did'

/**
 * as in prototype/services
 */
export interface IContact {
  metaData: {
    name: string
    addedAt?: number // timestamp
    addedBy?: IMyIdentity['identity']['address']
    unregistered?: boolean
  }
  did?: {
    identifier?: string
    document?: IDidDocumentSigned
  }

  publicIdentity: PublicIdentity
}

/**
 * local Identity
 */
export interface IMyIdentity {
  identity: Identity
  metaData: {
    name: string
  }
  phrase: string

  did?: IContact['did']
  createdAt?: number
}
