import { Identity, PublicIdentity } from '@kiltprotocol/sdk-js'
import { IDidDocument } from '@kiltprotocol/types'
import { KeypairType } from '@polkadot/util-crypto/types'

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
  keypairType: KeypairType
  metaData: {
    name: string
  }
  phrase: string

  did?: IContact['did']
  createdAt?: number
}
