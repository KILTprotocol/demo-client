import * as sdk from '@kiltprotocol/prototype-sdk'
import { v4 as uuid } from 'uuid'
import { MyDelegation, MyRootDelegation } from '../state/ducks/Delegations'
import * as Delegations from '../state/ducks/Delegations'

import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import BlockchainService from './BlockchainService'

class DelegationsService {
  public static createID() {
    return uuid()
  }

  public static async storeRoot(
    delegationRoot: sdk.DelegationRootNode,
    alias: string
  ): Promise<void> {
    return DelegationsService.storeRootOnChain(delegationRoot).then(() => {
      const { account, cTypeHash, id } = delegationRoot

      DelegationsService.store({
        account,
        cTypeHash,
        id,
        metaData: { alias },
      } as MyRootDelegation)
    })
  }

  public static async storeOnChain(
    delegation: sdk.DelegationNode,
    signature: string
  ) {
    const blockchain = await BlockchainService.connect()
    const selectedIdentity: sdk.Identity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    ).identity
    return delegation.store(blockchain, selectedIdentity, signature)
  }

  public static store(delegation: MyRootDelegation | MyDelegation) {
    PersistentStore.store.dispatch(
      Delegations.Store.saveDelegationAction(delegation)
    )
  }

  public static async queryNode(
    delegationNodeId: string
  ): Promise<sdk.IDelegationNode> {
    const blockchain = await BlockchainService.connect()
    return sdk.DelegationNode.query(blockchain, delegationNodeId)
  }

  public static async queryRootNode(
    delegationNodeId: sdk.IDelegationBaseNode['id']
  ): Promise<sdk.IDelegationRootNode> {
    const blockchain = await BlockchainService.connect()
    const node: sdk.IDelegationNode = await sdk.DelegationNode.query(
      blockchain,
      delegationNodeId
    )
    if (node) {
      return await node.getRoot(blockchain)
    }
    return await sdk.DelegationRootNode.query(blockchain, delegationNodeId)
  }

  private static async storeRootOnChain(delegation: sdk.DelegationRootNode) {
    const blockchain = await BlockchainService.connect()
    const selectedIdentity: sdk.Identity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    ).identity
    return delegation.store(blockchain, selectedIdentity)
  }
}

export default DelegationsService
