import * as sdk from '@kiltprotocol/sdk-js'

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
    document?: object
  }
  signature?: string
  publicIdentity: sdk.PublicIdentity
}

/**
 * local Identity
 */
export interface IMyIdentity {
  identity: sdk.Identity
  metaData: {
    name: string
  }
  phrase: string

  did?: IContact['did']
  createdAt?: number
}
