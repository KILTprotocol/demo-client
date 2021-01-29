import { Identity, PublicIdentity, IDidDocument } from '@kiltprotocol/sdk-js'

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
    document?: IDidDocument
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
