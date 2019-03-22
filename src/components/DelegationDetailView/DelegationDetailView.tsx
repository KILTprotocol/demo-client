import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import BlockchainService from 'src/services/BlockchainService'
import DelegationsService from 'src/services/DelegationsService'
import { notifyFailure } from 'src/services/FeedbackService'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import DelegationNode, {
  DelegationsTreeNode,
} from '../DelegationNode/DelegationNode'
import './DelegationDetailView.scss'

type Props = {
  id: sdk.IDelegationBaseNode['id']
}

type State = {
  delegationsTreeNode?: DelegationsTreeNode
  rootCTypeHash: sdk.ICType['hash']
}

class DelegationDetailView extends React.Component<Props, State> {
  private depth = 0

  constructor(props: Props) {
    super(props)
    this.state = {
      rootCTypeHash: undefined,
    }
  }

  public componentDidMount() {
    const { id } = this.props

    this.getNode(id).then(async (delegationNode: sdk.IDelegationNode) => {
      const treeNode: DelegationsTreeNode = {
        childNodes: [],
        delegation: delegationNode,
        myNode: true,
      } as DelegationsTreeNode

      const parentTreeNode:
        | DelegationsTreeNode
        | undefined = await this.resolveParent(treeNode)
      const cTypeHash: sdk.ICType['hash'] = await this.resolveRootCtype(
        treeNode
      )
      // DelegationDetailView#setState
      this.setState({
        delegationsTreeNode: parentTreeNode ? parentTreeNode : treeNode,
        rootCTypeHash: cTypeHash,
      })
    })
  }

  public render() {
    const { delegationsTreeNode, rootCTypeHash } = this.state

    return (
      <section className="DelegationDetailView">
        <h1>Delegation view</h1>
        <div className="delegationNodeContainer">
          {delegationsTreeNode && (
            <>
              <h2>
                <CTypePresentation cTypeHash={rootCTypeHash} />
              </h2>
              <div className="delegationNodeScrollContainer">
                <DelegationNode
                  key={delegationsTreeNode.delegation.id}
                  node={delegationsTreeNode}
                />
              </div>
            </>
          )}
        </div>
      </section>
    )
  }

  private async resolveParent(
    currentNode: DelegationsTreeNode
  ): Promise<DelegationsTreeNode | undefined> {
    const blockchain = await BlockchainService.connect()
    let parentDelegation:
      | sdk.IDelegationBaseNode
      | undefined = await currentNode.delegation.getParent(blockchain)

    if (!parentDelegation) {
      parentDelegation = await currentNode.delegation.getRoot(blockchain)
      if (
        parentDelegation &&
        parentDelegation.id === currentNode.delegation.id
      ) {
        parentDelegation = undefined
      }
    }
    if (!parentDelegation) {
      return undefined
    }
    return {
      childNodes: [currentNode],
      delegation: parentDelegation,
      myNode: false,
    } as DelegationsTreeNode
  }

  private async resolveRootCtype(
    currentNode: DelegationsTreeNode
  ): Promise<sdk.ICType['hash']> {
    const rootNode:
      | sdk.IDelegationRootNode
      | undefined = await DelegationsService.findRootNode(
      currentNode.delegation.id
    )
    if (rootNode) {
      return rootNode.cTypeHash
    }
    return undefined
  }

  private async getNode(
    id: sdk.IDelegationBaseNode['id']
  ): Promise<sdk.IDelegationBaseNode> {
    let node:
      | sdk.IDelegationBaseNode
      | undefined = await DelegationsService.lookupNodeById(id)
    if (!node) {
      node = await DelegationsService.lookupRootNodeById(id)
    }
    if (!node) {
      notifyFailure('Node not found')
      throw new Error('Node not found')
    }
    return node
  }
}

export default DelegationDetailView
