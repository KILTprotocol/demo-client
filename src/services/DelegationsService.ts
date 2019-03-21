import * as sdk from '@kiltprotocol/prototype-sdk'
import * as Delegations from '../state/ducks/Delegations'
import { MyDelegation, MyRootDelegation } from '../state/ducks/Delegations'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import BlockchainService from './BlockchainService'

class DelegationsService {
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
        type: Delegations.DelegationType.Root,
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
  ): Promise<sdk.IDelegationNode | undefined> {
    const blockchain = await BlockchainService.connect()
    return sdk.DelegationNode.query(blockchain, delegationNodeId)
  }

  /**
   * Query the root node for the intermediate node with `delegationNodeId`.
   *
   * @param delegationNodeId the id of the non-root node to query the root for
   */
  public static async queryRootNodeForIntermediateNode(
    delegationNodeId: sdk.IDelegationNode['id']
  ): Promise<sdk.IDelegationRootNode | undefined> {
    const blockchain = await BlockchainService.connect()
    const node:
      | sdk.IDelegationNode
      | undefined = await sdk.DelegationNode.query(blockchain, delegationNodeId)
    if (node) {
      return await node.getRoot(blockchain)
    }
    return await DelegationsService.queryRootNode(delegationNodeId)
  }

  public static async queryRootNode(
    rootNodeId: sdk.IDelegationRootNode['id']
  ): Promise<sdk.IDelegationRootNode | undefined> {
    const blockchain = await BlockchainService.connect()
    return await sdk.DelegationRootNode.query(blockchain, rootNodeId)
  }

  public static async importDelegation(
    delegationNodeId: sdk.IDelegationBaseNode['id'],
    alias?: string
  ): Promise<MyDelegation | undefined> {
    return new Promise<MyDelegation | undefined>((resolve, reject) => {
      DelegationsService.queryNode(delegationNodeId)
        .then((delegation: sdk.IDelegationNode | undefined) => {
          if (delegation) {
            const myDelegation: Delegations.MyDelegation = {
              account: delegation.account,
              id: delegation.id,
              metaData: {
                alias: alias || 'Unnamed delegation',
              },
              parentId: delegation.parentId,
              permissions: delegation.permissions,
              rootId: delegation.rootId,
              type: Delegations.DelegationType.Node,
            }
            DelegationsService.store(myDelegation)
            resolve(myDelegation)
          } else {
            resolve(undefined)
          }
        })
        .catch(error => {
          reject(error)
        })
    })
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
