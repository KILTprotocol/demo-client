import * as sdk from '@kiltprotocol/prototype-sdk'

/**
 * as in prototype/services
 */
export interface Contact {
  metaData: {
    name: string
    addedAt?: number // timestamp
    addedBy?: MyIdentity['identity']['address']
    unregistered?: boolean
  }
  did?: object
  signature?: string
  publicIdentity: sdk.PublicIdentity
}

/**
 * local Identity
 */
export interface MyIdentity {
  identity: sdk.Identity
  metaData: {
    name: string
  }
  phrase: string

  did?: sdk.IDid['identifier']
  createdAt?: number
}
