import * as sdk from '@kiltprotocol/prototype-sdk'
import * as Wallet from '../state/ducks/Wallet'
import persistentStore from '../state/PersistentStore'
import { Contact, MyIdentity } from '../types/Contact'
import BlockchainService from './BlockchainService'
import ContactRepository from './ContactRepository'
import MessageRepository from './MessageRepository'
import { object } from 'prop-types';

export class DidService {
  public static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/contacts/did`

  public static async resolveDid(
    identifier: string
  ): Promise<sdk.IPublicIdentity | undefined> {
    const blockchain = await BlockchainService.connect()
    return sdk.PublicIdentity.resolveFromDid(
      identifier,
      blockchain,
      this.URL_RESOLVER
    )
  }

  public static async createDid(myIdentity: MyIdentity): Promise<sdk.IDid> {
    const documentStore: sdk.IDid['documentStore'] = `${
      ContactRepository.URL
    }/${myIdentity.identity.address}`
    const did = sdk.Did.fromIdentity(myIdentity.identity, documentStore)
    const didDocument = did.getDefaultDocument(`${MessageRepository.URL}`)
    const hash = sdk.Crypto.hashStr(JSON.stringify(didDocument))
    const signature = myIdentity.identity.signStr(hash)
    await ContactRepository.add({
      did: didDocument,
      metaData: {
        name: myIdentity.metaData.name,
      },
      publicIdentity: myIdentity.identity.getPublicIdentity(),
      signature,
    } as Contact)

    const blockchain = await BlockchainService.connect()
    const status = await did.store(blockchain, myIdentity.identity)
    if (status.type !== 'Finalised') {
      throw new Error(
        `Error creating DID for identity ${myIdentity.metaData.name}`
      )
    }

    persistentStore.store.dispatch(
      Wallet.Store.updateIdentityAction(myIdentity.identity.address, {
        did: did.identifier,
      })
    )
    return did
  }

  public static async deleteDid(myIdentity: MyIdentity) {
    const blockchain = await BlockchainService.connect()
    const status = await sdk.Did.remove(blockchain, myIdentity.identity)
    if (status.type !== 'Finalised') {
      throw new Error(
        `Error deleting DID for identity ${myIdentity.metaData.name}`
      )
    }
    persistentStore.store.dispatch(
      Wallet.Store.updateIdentityAction(myIdentity.identity.address, {
        did: undefined,
      })
    )
  }

  private static readonly URL_RESOLVER = {
    resolve: async (url: string): Promise<object|undefined> => {
      return fetch(url)
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText)
          }
          return response
        })
        .then(response => response.json())
        .then(result => typeof result === 'object' ? result : undefined)
    },
  } as sdk.IURLResolver
}
