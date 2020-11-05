import * as sdk from '@kiltprotocol/sdk-js'
import { IDidDocumentSigned } from '@kiltprotocol/sdk-js/build/did/Did'
import * as Wallet from '../state/ducks/Wallet'
import persistentStore from '../state/PersistentStore'
import { IContact, IMyIdentity } from '../types/Contact'
import ContactRepository from './ContactRepository'
import MessageRepository from './MessageRepository'

class DidService {
  public static readonly URL = `${window._env_.REACT_APP_SERVICE_HOST}/contacts/did`

  public static async resolveDid(
    identifier: string
  ): Promise<sdk.IPublicIdentity | null> {
    return sdk.PublicIdentity.resolveFromDid(identifier, this.URL_RESOLVER)
  }

  public static async createDid(myIdentity: IMyIdentity): Promise<sdk.IDid> {
    const documentStore: sdk.IDid['documentStore'] = `${ContactRepository.URL}/${myIdentity.identity.address}`

    const did = sdk.Did.fromIdentity(myIdentity.identity, documentStore)
    const didDocument = did.createDefaultDidDocument(`${MessageRepository.URL}`)
    const signedDidDocument: IDidDocumentSigned = sdk.Did.signDidDocument(
      didDocument,
      myIdentity.identity
    )

    await ContactRepository.add({
      did: signedDidDocument,
      metaData: {
        name: myIdentity.metaData.name,
      },
      publicIdentity: myIdentity.identity.getPublicIdentity(),
    } as IContact)

    const tx = await did.store(myIdentity.identity)
    const status = await sdk.Blockchain.submitSignedTx(tx)
    if (status.isError) {
      throw new Error(
        `Error creating DID for identity ${myIdentity.metaData.name}`
      )
    }

    persistentStore.store.dispatch(
      Wallet.Store.updateIdentityAction(myIdentity.identity.address, {
        did: { identifier: did.identifier, document: signedDidDocument },
      })
    )
    return did
  }

  public static async deleteDid(myIdentity: IMyIdentity): Promise<void> {
    const tx = await sdk.Did.remove(myIdentity.identity)
    const status = await sdk.Blockchain.submitSignedTx(tx)
    if (status.isError) {
      throw new Error(
        `Error deleting DID for identity ${myIdentity.metaData.name}`
      )
    }
    await ContactRepository.add({
      did: undefined,
      metaData: {
        name: myIdentity.metaData.name,
      },
      publicIdentity: myIdentity.identity.getPublicIdentity(),
    } as IContact)
    persistentStore.store.dispatch(
      Wallet.Store.updateIdentityAction(myIdentity.identity.address, {
        did: undefined,
      })
    )
  }

  private static readonly URL_RESOLVER = {
    resolve: async (url: string): Promise<object | undefined> => {
      return fetch(url)
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText)
          }
          return response
        })
        .then(response => response.json())
        .then(result => (typeof result === 'object' ? result : undefined))
    },
  } as sdk.IURLResolver
}

export default DidService
