import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import DelegationsService from '../../services/DelegationsService'
import { notifyFailure } from '../../services/FeedbackService'
import { IMyDelegation } from '../../state/ducks/Delegations'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { IMyIdentity } from '../../types/Contact'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import DelegationNode, {
  DelegationsTreeNode,
  ViewType,
} from '../DelegationNode/DelegationNode'

import './DelegationDetailView.scss'

type StateProps = {
  selectedIdentity: IMyIdentity
}

type OwnProps = {
  id: sdk.IDelegationBaseNode['id']

  editable?: boolean
  focusedNodeAlias?: IMyDelegation['metaData']['alias']
  isPCR?: boolean
  viewType?: ViewType
}

type Props = StateProps & OwnProps

type State = {
  delegationsTreeNode?: DelegationsTreeNode
  rootNode: sdk.IDelegationRootNode | null
}

class DelegationDetailView extends React.Component<Props, State> {
  private static async resolveRootNode(
    currentNode: DelegationsTreeNode
  ): Promise<sdk.IDelegationRootNode | null> {
    const rootNode: sdk.IDelegationRootNode | null = await DelegationsService.findRootNode(
      currentNode.delegation.id
    )
    return rootNode
  }

  private static async getNode(
    id: sdk.IDelegationBaseNode['id']
  ): Promise<sdk.DelegationBaseNode> {
    let node: sdk.DelegationBaseNode | null = await DelegationsService.lookupNodeById(
      id
    )
    if (!node) {
      node = await DelegationsService.lookupRootNodeById(id)
    }
    if (!node) {
      notifyFailure('Node not found')
      throw new Error('Node not found')
    }
    return node
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      rootNode: null,
    }
  }

  public componentDidMount(): void {
    const { id } = this.props

    DelegationDetailView.getNode(id)
      .then(async (delegationNode: sdk.DelegationNode) => {
        const treeNode: DelegationsTreeNode = {
          childNodes: [],
          delegation: delegationNode,
        } as DelegationsTreeNode

        const rootNode: State['rootNode'] = await DelegationDetailView.resolveRootNode(
          treeNode
        )
        const parentTreeNode: DelegationsTreeNode = await DelegationsService.resolveParent(
          treeNode
        )

        this.setState({
          delegationsTreeNode: parentTreeNode || treeNode,
          rootNode,
        })
      })
      .catch(error => {
        console.log('error', error)
      })
  }

  public render(): JSX.Element {
    const {
      viewType,
      editable,
      id,
      isPCR,
      focusedNodeAlias,
      selectedIdentity,
    } = this.props
    const { delegationsTreeNode, rootNode } = this.state

    return (
      <section className="DelegationDetailView">
        <h1>{isPCR ? 'PCR view' : 'Delegation tree'}</h1>
        <div className="delegationNodeContainer">
          {delegationsTreeNode && (
            <>
              {rootNode && (
                <h2>
                  <span>CType: </span>
                  <CTypePresentation
                    cTypeHash={rootNode.cTypeHash}
                    interactive
                    linked
                    inline
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
                  viewType={viewType}
                />
              </div>
              {viewType === ViewType.OnCreation && (
                <div className="viewTypeLabel">Tree at creation</div>
              )}
              {viewType === ViewType.Present && (
                <div className="viewTypeLabel">Current tree</div>
              )}
            </>
          )}
        </div>
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(DelegationDetailView)
