import {
  BlockchainUtils,
  DelegationBaseNode,
  DelegationNode,
  DelegationRootNode,
  Identity,
  SubmittableExtrinsic,
} from '@kiltprotocol/sdk-js'
import {
  IDelegationBaseNode,
  IDelegationNode,
  IDelegationRootNode,
} from '@kiltprotocol/types'
import { DelegationsTreeNode } from '../components/DelegationNode/DelegationNode'
import { IMyDelegation } from '../state/ducks/Delegations'
import * as Delegations from '../state/ducks/Delegations'
import * as Wallet from '../state/ducks/Wallet'
import { persistentStoreInstance } from '../state/PersistentStore'

class DelegationsService {
  public static async storeRoot(
    delegationRoot: DelegationRootNode,
    alias: string,
    isPCR: boolean
  ): Promise<void> {
    const tx = DelegationsService.storeRootOnChain(delegationRoot)

    await BlockchainUtils.submitSignedTx(await tx, {
      resolveOn: BlockchainUtils.IS_IN_BLOCK,
    })

    return tx.then(() => {
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
    delegation: DelegationNode,
    signature: string
  ): Promise<SubmittableExtrinsic> {
    const selectedIdentity = Wallet.getSelectedIdentity(
      persistentStoreInstance.store.getState()
    )?.identity

    if (!selectedIdentity) {
      throw new Error('No selected Identity')
    }
    return delegation.store(selectedIdentity, signature)
  }

  public static store(delegation: IMyDelegation): void {
    persistentStoreInstance.store.dispatch(
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
    delegationNodeId: IDelegationBaseNode['id']
  ): Promise<DelegationNode | null> {
    return DelegationNode.query(delegationNodeId)
  }

  /**
   * Performs a lookup for a delegation root not with the given `rootNodeId`
   *
   * @param rootNodeId id of the desired root node
   */
  public static async lookupRootNodeById(
    rootNodeId: IDelegationRootNode['id']
  ): Promise<DelegationRootNode | null> {
    return DelegationRootNode.query(rootNodeId)
  }

  /**
   * Tries to find the root node for an arbitrary node within the hierarchy.
   *
   * @param delegationNodeId the id of the node to find the root node for
   */
  public static async findRootNode(
    delegationNodeId: IDelegationNode['id']
  ): Promise<DelegationRootNode | null> {
    const node = await DelegationNode.query(delegationNodeId)
    if (node) {
      return node.getRoot()
    }
    return DelegationsService.lookupRootNodeById(delegationNodeId)
  }

  public static async importDelegation(
    delegationNodeId: IDelegationBaseNode['id'],
    alias: string,
    isPCR?: boolean
  ): Promise<IMyDelegation | null> {
    const delegation = await DelegationsService.lookupNodeById(delegationNodeId)
    if (delegation) {
      const root = await delegation.getRoot()
      const myDelegation: Delegations.IMyDelegation = {
        ...delegation,
        cTypeHash: root && root.cTypeHash,
        isPCR,
        metaData: { alias },
        revoked: false,
        type: Delegations.DelegationType.Node,
      }
      DelegationsService.store(myDelegation)
      return myDelegation
    }
    const root = await DelegationsService.lookupRootNodeById(delegationNodeId)
    if (root) {
      const myDelegation: Delegations.IMyDelegation = {
        ...root,
        isPCR,
        metaData: { alias },
        revoked: false,
        type: Delegations.DelegationType.Root,
      }
      DelegationsService.store(myDelegation)
      return myDelegation
    }
    return null
  }

  public static async revoke(
    node: DelegationBaseNode,
    identity: Identity
  ): Promise<void> {
    await node.revoke(identity)
    persistentStoreInstance.store.dispatch(
      Delegations.Store.revokeDelegationAction(node.id)
    )
  }

  public static async resolveParent(
    currentNode: DelegationsTreeNode
  ): Promise<DelegationsTreeNode> {
    const parentDelegation: IDelegationBaseNode | null = await currentNode.delegation.getParent()

    if (!parentDelegation) {
      return currentNode
    }
    return this.resolveParent({
      childNodes: [currentNode],
      delegation: parentDelegation,
    } as DelegationsTreeNode)
  }

  private static async storeRootOnChain(
    delegation: DelegationRootNode
  ): Promise<SubmittableExtrinsic> {
    const selectedIdentity = Wallet.getSelectedIdentity(
      persistentStoreInstance.store.getState()
    )?.identity

    if (!selectedIdentity) {
      throw new Error('No selected Identity')
    }

    return delegation.store(selectedIdentity)
  }
}

export default DelegationsService
