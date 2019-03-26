import * as sdk from '@kiltprotocol/prototype-sdk'
import { MyIdentity } from '../types/Contact'
import BlockchainService from './BlockchainService'
import * as Wallet from '../state/ducks/Wallet'
import persistentStore from '../state/PersistentStore'

export class DidService {
  public static async createDid(myIdentity: MyIdentity): Promise<sdk.IDid> {
    const blockchain = await BlockchainService.connect()
    const did = sdk.Did.fromIdentity(myIdentity.identity) // TODO include documentStore
    const status = await did.store(blockchain, myIdentity.identity)
    if (status.type !== 'Finalised') {
      throw new Error(
        `Error creating DID for identity ${myIdentity.metaData.name}`
      )
    }
    myIdentity.did = did.identifier
    persistentStore.store.dispatch(Wallet.Store.saveIdentityAction(myIdentity))
    return did
  }

  public static async deleteDid(myIdentity: MyIdentity) {
    const blockchain = await BlockchainService.connect()
    const did = sdk.Did.fromIdentity(myIdentity.identity)
    const status = await did.remove(blockchain, myIdentity.identity)
    if (status.type !== 'Finalised') {
      throw new Error(
        `Error deleting DID for identity ${myIdentity.metaData.name}`
      )
    }
    myIdentity.did = undefined
    persistentStore.store.dispatch(Wallet.Store.saveIdentityAction(myIdentity))
  }
}
