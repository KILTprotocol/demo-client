import {
  DelegationBaseNode,
  DelegationNode as SDKDelegationNode,
} from '@kiltprotocol/sdk-js'
import { IDelegationBaseNode, IDelegationRootNode } from '@kiltprotocol/types'
import React, { useState, useEffect } from 'react'
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
  selectedIdentity?: IMyIdentity
}

type OwnProps = {
  delegationId: IDelegationBaseNode['id']

  editable?: boolean
  focusedNodeAlias?: IMyDelegation['metaData']['alias']
  isPCR?: boolean
  viewType?: ViewType
}

type Props = StateProps & OwnProps

const getNode = async (
  id: IDelegationBaseNode['id']
): Promise<DelegationBaseNode> => {
  let node: DelegationBaseNode | null = await DelegationsService.lookupNodeById(
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

  const [rootNode, setRootNode] = useState<IDelegationRootNode | null>(null)

  useEffect(() => {
    getNode(delegationId)
      .then(async (delegationNode: SDKDelegationNode) => {
        const treeNode: DelegationsTreeNode = {
          childNodes: [],
          delegation: delegationNode,
        }
        const newRootNode = await DelegationsService.findRootNode(
          treeNode.delegation.id
        )
        setRootNode(newRootNode)

        const parentTreeNode = await DelegationsService.resolveParent(treeNode)
        setDelegationsTreeNode(parentTreeNode || treeNode)
      })
      .catch(error => {
        console.log('error', error)
      })
  }, [delegationId])

  if (!selectedIdentity) {
    return null
  }

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
