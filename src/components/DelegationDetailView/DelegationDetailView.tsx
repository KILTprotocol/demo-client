import * as sdk from '@kiltprotocol/sdk-js'
import React, { useState, useEffect, useCallback } from 'react'
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
  delegationId: sdk.IDelegationBaseNode['id']

  editable?: boolean
  focusedNodeAlias?: IMyDelegation['metaData']['alias']
  isPCR?: boolean
  viewType?: ViewType
}

type Props = StateProps & OwnProps

const DelegationDetailView: React.FunctionComponent<Props> = ({
  delegationId,
  editable,
  focusedNodeAlias,
  isPCR,
  viewType,
  selectedIdentity,
}) => {
  const [delegationsTreeNode, setDelegationsTreeNode] = useState<
    DelegationsTreeNode | undefined
  >(undefined)

  const [rootNode, setRootNode] = useState<sdk.IDelegationRootNode | null>(null)

  const getNode = async (
    id: sdk.IDelegationBaseNode['id']
  ): Promise<sdk.DelegationBaseNode> => {
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

  const delegationTreeForester = useCallback((): void => {
    getNode(delegationId)
      .then(async (delegationNode: sdk.DelegationNode) => {
        const treeNode: DelegationsTreeNode = {
          childNodes: [],
          delegation: delegationNode,
        }
        const rootNodeFind = await DelegationsService.findRootNode(
          treeNode.delegation.id
        )
        setRootNode(rootNodeFind)

        const delegationTreeNode = await DelegationsService.resolveParent(
          treeNode
        )
        setDelegationsTreeNode(delegationTreeNode)
      })
      .catch(error => {
        console.log('error', error)
      })
  }, [delegationId])

  useEffect(() => {
    delegationTreeForester()
  }, [delegationId, delegationTreeForester])

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
                focusedNodeId={delegationId}
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

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(DelegationDetailView)
