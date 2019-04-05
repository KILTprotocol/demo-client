import * as sdk from '@kiltprotocol/prototype-sdk'

import { MyDelegation } from '../state/ducks/Delegations'
import * as Delegations from '../state/ducks/Delegations'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import BlockchainService from './BlockchainService'

class DelegationsService {
  public static async storeRoot(
    delegationRoot: sdk.DelegationRootNode,
    alias: string,
    isPCR: boolean
  ): Promise<void> {
    return DelegationsService.storeRootOnChain(delegationRoot).then(() => {
      const { account, cTypeHash, id } = delegationRoot

      const myDelegation: MyDelegation = {
        account,
        cTypeHash,
        id,
        isPCR,
        metaData: { alias },
        revoked: false,
        type: Delegations.DelegationType.Root,
      }
      DelegationsService.store(myDelegation)
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

  public static store(delegation: MyDelegation) {
    PersistentStore.store.dispatch(
      Delegations.Store.saveDelegationAction(delegation)
    )
  }

  /**
   * Performs a lookup for a delegation node with the given `delegationNodeId`.
   * Note: the lookup will not check for root node types.
   *
   * @param delegationNodeId id of the intermediate node (non-root node)
   */
  public static async lookupNodeById(
    delegationNodeId: string
  ): Promise<sdk.IDelegationNode | undefined> {
    const blockchain = await BlockchainService.connect()
    return sdk.DelegationNode.query(blockchain, delegationNodeId)
  }

  /**
   * Performs a lookup for a delegation root not with the given `rootNodeId`
   *
   * @param rootNodeId id of the desired root node
   */
  public static async lookupRootNodeById(
    rootNodeId: sdk.IDelegationRootNode['id']
  ): Promise<sdk.IDelegationRootNode | undefined> {
    const blockchain = await BlockchainService.connect()
    return await sdk.DelegationRootNode.query(blockchain, rootNodeId)
  }

  /**
   * Tries to find the root node for an arbitrary node within the hierarchy.
   *
   * @param delegationNodeId the id of the node to find the root node for
   */
  public static async findRootNode(
    delegationNodeId: sdk.IDelegationNode['id']
  ): Promise<sdk.IDelegationRootNode | undefined> {
    const blockchain = await BlockchainService.connect()
    const node:
      | sdk.IDelegationNode
      | undefined = await sdk.DelegationNode.query(blockchain, delegationNodeId)
    if (node) {
      return await node.getRoot(blockchain)
    }
    return await DelegationsService.lookupRootNodeById(delegationNodeId)
  }

  public static async importDelegation(
    delegationNodeId: sdk.IDelegationBaseNode['id'],
    alias: string,
    isPCR?: boolean
  ): Promise<MyDelegation | undefined> {
    return new Promise<MyDelegation | undefined>(async (resolve, reject) => {
      try {
        const delegation:
          | sdk.IDelegationNode
          | undefined = await DelegationsService.lookupNodeById(
          delegationNodeId
        )
        if (delegation) {
          const blockchain = await BlockchainService.connect()
          const root:
            | sdk.IDelegationRootNode
            | undefined = await delegation.getRoot(blockchain)
          const myDelegation: Delegations.MyDelegation = {
            account: delegation.account,
            cTypeHash: root && root.cTypeHash,
            id: delegation.id,
            isPCR,
            metaData: { alias },
            parentId: delegation.parentId,
            permissions: delegation.permissions,
            revoked: false,
            rootId: delegation.rootId,
            type: Delegations.DelegationType.Node,
          }
          DelegationsService.store(myDelegation)
          resolve(myDelegation)
        } else {
          resolve(undefined)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  public static async revoke(
    node: sdk.IDelegationBaseNode,
    identity: sdk.Identity
  ) {
    const blockchain = await BlockchainService.connect()
    try {
      await node.revoke(blockchain, identity)
      PersistentStore.store.dispatch(
        Delegations.Store.revokeDelegationAction(node.id)
      )
    } catch (error) {
      throw error
    }
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
