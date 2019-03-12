import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import CTypeRepository from '../../services/CtypeRepository'

import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'
import { ICType } from '../../types/Ctype'
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
}

class DelegationDetailView extends React.Component<Props, State> {
  private depth = 0

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    const { id } = this.props

    // TODO: use sdk's getNode()
    this.getNode(id).then((myNode: sdk.IDelegationNode) => {
      // start resolving to root
      this.resolveParent({ ...myNode, childNodes: [], myNode: true }).then(
        (delegationsTreeNode: DelegationsTreeNode) => {
          this.setState({ delegationsTreeNode })
        }
      )
    })
  }

  public render() {
    const { delegationsTreeNode } = this.state

    return (
      <section className="DelegationDetailView">
        <h1>Delegation view</h1>
        <div className="delegationNodeContainer">
          {delegationsTreeNode && (
            <>
              <h2>
                <CTypePresentation cTypeHash={delegationsTreeNode.cTypeHash} />
              </h2>
              <div className="delegationNodeScrollContainer">
                <DelegationNode node={delegationsTreeNode} />
              </div>
            </>
          )}
        </div>
      </section>
    )
  }

  private async resolveParent(
    currentNode: DelegationsTreeNode
  ): Promise<DelegationsTreeNode> {
    return currentNode.getParent().then((parentNode: sdk.IDelegationNode) => {
      // so far we assume we never have a broken branch,
      // so the last parent equals the root
      if (parentNode) {
        return this.resolveParent({
          ...parentNode,
          childNodes: [currentNode],
        })
      } else {
        // TODO: adjust when sdk can handle dags
        return this.getRootNode(currentNode)
      }
    })
  }

  // TODO: use sdk methods
  private rotateIds(id: sdk.IDelegationBaseNode['id']) {
    const myIdentities = Wallet.getAllIdentities(
      PersistentStore.store.getState()
    )

    const idIndex = myIdentities.findIndex(
      (myIdentity: MyIdentity) => myIdentity.identity.address === id
    )

    if (idIndex !== -1) {
      return myIdentities[idIndex + 1]
        ? myIdentities[idIndex + 1].identity.address
        : myIdentities[0].identity.address
    } else {
      return id
    }
  }

  private getPermissions(id: sdk.IDelegationBaseNode['id']) {
    const myIdentities = Wallet.getAllIdentities(
      PersistentStore.store.getState()
    )
    const possiblePermisions = [['canAttest', 'canDelegate'], ['canAttest']]
    const idIndex = myIdentities.findIndex(
      (myIdentity: MyIdentity) => myIdentity.identity.address === id
    )
    return possiblePermisions[idIndex] || []
  }

  private async getRootNode(
    currentNode: DelegationsTreeNode
  ): Promise<DelegationsTreeNode> {
    return CTypeRepository.findAll().then((cTypes: ICType[]) => {
      return { ...currentNode, cTypeHash: cTypes[0].cType.hash }
    })
  }

  private async getParentNode(
    id: sdk.IDelegationBaseNode['id']
  ): Promise<sdk.IDelegationBaseNode | sdk.IDelegationRootNode | null> {
    this.depth++
    return this.depth <= 5 ? this.getNode(id) : null
  }

  private async getNode(
    id: sdk.IDelegationBaseNode['id']
  ): Promise<sdk.IDelegationNode> {
    return Promise.resolve({
      account: id,
      getChildren: this.getChildren.bind(this),
      getParent: this.getParentNode.bind(this, this.rotateIds(id)),
      getRoot: this.getRootNode.bind(this, id),
      id: id + Date.now(),
      permissions: this.getPermissions(id),
    })
  }

  private getChildren(): Promise<sdk.IDelegationNode[]> {
    const myIdentities = Wallet.getAllIdentities(
      PersistentStore.store.getState()
    )
    return Promise.all(
      myIdentities.map((myIdentity: MyIdentity) =>
        this.getNode(myIdentity.identity.address)
      )
    )
  }
}

export default DelegationDetailView
