import * as sdk from '@kiltprotocol/prototype-sdk'

/**
 * as in prototype/services
 */
export interface Contact {
  metaData: {
    name: string
    addedAt?: number // timestamp
    addedBy?: MyIdentity['identity']['address']
  }
  publicIdentity: sdk.PublicIdentity
}

/**
 * local Identity
 */
export interface MyIdentity {
  did?: sdk.IDid['identifier']
  identity: sdk.Identity
  metaData: {
    name: string
  }
  phrase: string
}
