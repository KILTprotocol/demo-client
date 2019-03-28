import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'

import BlockchainService from '../../services/BlockchainService'
import DelegationsService from '../../services/DelegationsService'
import { notifyFailure } from '../../services/FeedbackService'
import { MyDelegation } from '../../state/ducks/Delegations'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import DelegationNode, {
  DelegationsTreeNode,
} from '../DelegationNode/DelegationNode'

import './DelegationDetailView.scss'

type Props = {
  id: sdk.IDelegationBaseNode['id']

  currentView?: boolean
  editable?: boolean
  focusedNodeAlias?: MyDelegation['metaData']['alias']

  // mapStateToProps
  selectedIdentity: MyIdentity
}

type State = {
  delegationsTreeNode?: DelegationsTreeNode
  rootNode?: sdk.IDelegationRootNode
}

class DelegationDetailView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    const { id } = this.props

    this.getNode(id)
      .then(async (delegationNode: sdk.IDelegationNode) => {
        const treeNode: DelegationsTreeNode = {
          childNodes: [],
          delegation: delegationNode,
        } as DelegationsTreeNode

        const rootNode: State['rootNode'] = await this.resolveRootNode(treeNode)
        const parentTreeNode: DelegationsTreeNode = await this.resolveParent(
          treeNode
        )

        this.setState({
          delegationsTreeNode: parentTreeNode ? parentTreeNode : treeNode,
          rootNode,
        })
      })
      .catch(error => {
        console.log('error', error)
      })
  }

  public render() {
    const {
      currentView,
      editable,
      id,
      focusedNodeAlias,
      selectedIdentity,
    } = this.props
    const { delegationsTreeNode, rootNode } = this.state

    return (
      <section className="DelegationDetailView">
        <h1>Delegation tree</h1>
        <div className="delegationNodeContainer">
          {delegationsTreeNode && (
            <>
              {rootNode && (
                <h2>
                  <span>CType: </span>
                  <CTypePresentation
                    cTypeHash={rootNode.cTypeHash}
                    inline={true}
                  />
                </h2>
              )}
              {!rootNode && <h2>No CType!</h2>}
              <br />
              <div className="delegationNodeScrollContainer">
                <DelegationNode
                  key={delegationsTreeNode.delegation.id}
                  node={delegationsTreeNode}
                  selectedIdentity={selectedIdentity}
                  focusedNodeId={id}
                  focusedNodeAlias={focusedNodeAlias}
                  editable={editable}
                  currentView={currentView}
                />
              </div>
              {!currentView && (
                <div className="currentViewLabel">Tree at creation</div>
              )}
              {currentView && (
                <div className="currentViewLabel">Current tree</div>
              )}
            </>
          )}
        </div>
      </section>
    )
  }

  private async resolveParent(
    currentNode: DelegationsTreeNode
  ): Promise<DelegationsTreeNode> {
    const blockchain = await BlockchainService.connect()
    const parentDelegation:
      | sdk.IDelegationBaseNode
      | undefined = await currentNode.delegation.getParent(blockchain)

    if (!parentDelegation) {
      return currentNode
    } else {
      return this.resolveParent({
        childNodes: [currentNode],
        delegation: parentDelegation,
      } as DelegationsTreeNode)
    }
  }

  private async resolveRootNode(
    currentNode: DelegationsTreeNode
  ): Promise<sdk.IDelegationRootNode | undefined> {
    const rootNode:
      | sdk.IDelegationRootNode
      | undefined = await DelegationsService.findRootNode(
      currentNode.delegation.id
    )
    return rootNode
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

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(DelegationDetailView)
