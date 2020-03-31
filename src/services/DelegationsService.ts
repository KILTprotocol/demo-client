import * as sdk from '@kiltprotocol/sdk-js'

import { DelegationsTreeNode } from '../components/DelegationNode/DelegationNode'
import { IMyDelegation } from '../state/ducks/Delegations'
import * as Delegations from '../state/ducks/Delegations'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'

class DelegationsService {
  public static async storeRoot(
    delegationRoot: sdk.DelegationRootNode,
    alias: string,
    isPCR: boolean
  ): Promise<void> {
    return DelegationsService.storeRootOnChain(delegationRoot).then(() => {
      const { account, cTypeHash, id } = delegationRoot

      const myDelegation: IMyDelegation = {
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
  ): Promise<sdk.TxStatus> {
    const selectedIdentity: sdk.Identity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    ).identity
    return delegation.store(selectedIdentity, signature)
  }

  public static store(delegation: IMyDelegation): void {
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
  ): Promise<sdk.DelegationNode | null> {
    return sdk.DelegationNode.query(delegationNodeId)
  }

  /**
   * Performs a lookup for a delegation root not with the given `rootNodeId`
   *
   * @param rootNodeId id of the desired root node
   */
  public static async lookupRootNodeById(
    rootNodeId: sdk.IDelegationRootNode['id']
  ): Promise<sdk.DelegationRootNode | null> {
    return sdk.DelegationRootNode.query(rootNodeId)
  }

  /**
   * Tries to find the root node for an arbitrary node within the hierarchy.
   *
   * @param delegationNodeId the id of the node to find the root node for
   */
  public static async findRootNode(
    delegationNodeId: sdk.IDelegationNode['id']
  ): Promise<sdk.DelegationRootNode | null> {
    const node = await sdk.DelegationNode.query(delegationNodeId)
    if (node) {
      return node.getRoot()
    }
    return DelegationsService.lookupRootNodeById(delegationNodeId)
  }

  public static async importDelegation(
    delegationNodeId: sdk.IDelegationBaseNode['id'],
    alias: string,
    isPCR?: boolean
  ): Promise<IMyDelegation | null> {
    const delegation = await DelegationsService.lookupNodeById(delegationNodeId)
    if (delegation) {
      const root = await delegation.getRoot()
      const myDelegation: Delegations.IMyDelegation = {
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
      return myDelegation
    }
    return null
  }

  public static async revoke(
    node: sdk.DelegationBaseNode,
    identity: sdk.Identity
  ): Promise<void> {
    await node.revoke(identity)
    PersistentStore.store.dispatch(
      Delegations.Store.revokeDelegationAction(node.id)
    )
  }

  public static async resolveParent(
    currentNode: DelegationsTreeNode
  ): Promise<DelegationsTreeNode> {
    const parentDelegation: sdk.IDelegationBaseNode | null = await currentNode.delegation.getParent()

    if (!parentDelegation) {
      return currentNode
    }
    return this.resolveParent({
      childNodes: [currentNode],
      delegation: parentDelegation,
    } as DelegationsTreeNode)
  }

  private static async storeRootOnChain(
    delegation: sdk.DelegationRootNode
  ): Promise<sdk.TxStatus> {
    const selectedIdentity: sdk.Identity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    ).identity
    return delegation.store(selectedIdentity)
  }
}

export default DelegationsService
