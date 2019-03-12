import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import DelegationNode, {
  DelegationsTreeNode,
} from '../DelegationNode/DelegationNode'

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
      this.resolveParent({ ...myNode, childNodes: [] }).then(
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
        {delegationsTreeNode && <DelegationNode node={delegationsTreeNode} />}
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
        return {
          ...currentNode,
          cTypeHash:
            '0x124e8787af5e2518e6499018735f28b4af301f5f15fd70febcd5ab027813076d',
        }
      }
    })
  }

  // TODO: use sdk methods
  private rotateIds(id: sdk.IDelegationBaseNode['id']) {
    const ids = {
      '5Dk1WKyFyXwPbVGibxkZMKF6cRJS45R3qt9FeD13beajN5Vg':
        '5F91Bu2oFeBi2JWid98jFvNrseVCDsxskPfYRQdpnBpbTSMm',
      '5F6HP6FHy3Gs65oX2dUUbovKFdXGFGXgmPGFNcis1ePGkanF':
        '5Dk1WKyFyXwPbVGibxkZMKF6cRJS45R3qt9FeD13beajN5Vg',
      '5F91Bu2oFeBi2JWid98jFvNrseVCDsxskPfYRQdpnBpbTSMm':
        '5F6HP6FHy3Gs65oX2dUUbovKFdXGFGXgmPGFNcis1ePGkanF',
    }
    return ids[id]
  }

  private getPermissions(id: sdk.IDelegationBaseNode['id']) {
    const ids = {
      '5Dk1WKyFyXwPbVGibxkZMKF6cRJS45R3qt9FeD13beajN5Vg': [
        'canAttest',
        'canDelegate',
      ],
      '5F6HP6FHy3Gs65oX2dUUbovKFdXGFGXgmPGFNcis1ePGkanF': ['canAttest'],
      '5F91Bu2oFeBi2JWid98jFvNrseVCDsxskPfYRQdpnBpbTSMm': [],
    }
    return ids[id]
  }

  private async getRootNode(
    id: sdk.IDelegationBaseNode['id']
  ): Promise<sdk.IDelegationRootNode> {
    const node = await this.getNode(id)
    return Promise.resolve({
      ...node,
      ctypeHash:
        '0x124e8787af5e2518e6499018735f28b4af301f5f15fd70febcd5ab027813076d',
    })
  }

  private async getParentNode(
    id: sdk.IDelegationBaseNode['id']
  ): Promise<sdk.IDelegationBaseNode | sdk.IDelegationRootNode | null> {
    this.depth++
    return this.depth <= 10 ? this.getNode(id) : null
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
    return new Promise<sdk.IDelegationNode[]>((resolve, reject) => {
      const children: sdk.IDelegationNode[] = []
      this.getNode('5Dk1WKyFyXwPbVGibxkZMKF6cRJS45R3qt9FeD13beajN5Vg').then(
        (node1: sdk.IDelegationNode) => {
          children.push(node1)
          this.getNode('5F6HP6FHy3Gs65oX2dUUbovKFdXGFGXgmPGFNcis1ePGkanF').then(
            (node2: sdk.IDelegationNode) => {
              children.push(node2)
              this.getNode(
                '5F91Bu2oFeBi2JWid98jFvNrseVCDsxskPfYRQdpnBpbTSMm'
              ).then((node3: sdk.IDelegationNode) => {
                children.push(node3)
                resolve(children)
              })
            }
          )
        }
      )
    })
  }
}

export default DelegationDetailView
