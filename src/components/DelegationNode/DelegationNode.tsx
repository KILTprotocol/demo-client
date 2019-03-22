import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import BlockchainService from 'src/services/BlockchainService'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import './DelegationNode.scss'
import ShortHash from '../ShortHash/ShortHash'

export class DelegationsTreeNode {
  public delegation: sdk.IDelegationNode | sdk.IDelegationRootNode
  public childNodes: DelegationsTreeNode[]
  public myNode: boolean
}

type Props = {
  node: DelegationsTreeNode
  onGetChildren?: () => void
}

type State = {
  node: DelegationsTreeNode
}

class DelegationNode extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      node: props.node,
    }

    this.getChildren = this.getChildren.bind(this)
    this.getSiblings = this.getSiblings.bind(this)
  }

  public render() {
    const { onGetChildren } = this.props
    const { node } = this.state
    const { delegation, myNode } = node
    const { permissions } = delegation as sdk.IDelegationNode

    return (
      <section
        key={delegation.id}
        className={`DelegationNode
        ${!node.childNodes.length ? 'hasNoChildren' : ''}
        ${myNode ? 'myNode' : ''}
        `}
      >
        <div className="label">
          <ContactPresentation address={delegation.account} />
          {permissions && this.getPermissions()}{' '}
          <ShortHash length={10}>{delegation.id}</ShortHash>'
        </div>
        {onGetChildren && (
          <button className="getSiblings" onClick={this.getSiblings} />
        )}
        {!node.childNodes.length && (
          <button className="getChildren" onClick={this.getChildren} />
        )}
        {node.childNodes.map((childNode: DelegationsTreeNode) => (
          <DelegationNode
            key={childNode.delegation.id}
            node={childNode}
            onGetChildren={this.getChildren}
          />
        ))}
      </section>
    )
  }

  private getPermissions() {
    const { node } = this.state
    const { delegation } = node
    const { permissions } = delegation as sdk.IDelegationNode
    const possiblePermissions = [sdk.Permission.ATTEST, sdk.Permission.DELEGATE]

    return (
      <div className="permissions">
        {possiblePermissions.map((possiblePermission: sdk.Permission) => {
          const allowed = permissions.indexOf(possiblePermission) !== -1
          const permissionClassName: string = this.getPermissionName(
            possiblePermission
          )
          return (
            <span
              key={possiblePermission}
              title={this.getPermissionTitle(possiblePermission, allowed)}
              className={`${possiblePermission} ${
                allowed ? 'allowed' : 'denied'
              }`}
            />
          )
        })}
      </div>
    )
  }

  private getPermissionName(permission: sdk.Permission): string {
    if (permission === sdk.Permission.ATTEST) {
      return 'attest'
    } else if (permission === sdk.Permission.DELEGATE) {
      return 'delegate'
    }
    return ''
  }

  private getPermissionTitle(
    permission: sdk.Permission,
    allowed: boolean
  ): string {
    if (allowed) {
      return 'can ' + this.getPermissionName(permission)
    }
    return 'can NOT ' + this.getPermissionName(permission)
  }

  private getSiblings() {
    const { onGetChildren } = this.props
    if (onGetChildren) {
      onGetChildren()
    }
  }

  private async getChildren() {
    const { node } = this.state
    const { delegation } = node
    const blockchain = await BlockchainService.connect()
    const children: sdk.IDelegationNode[] = await delegation.getChildren(
      blockchain
    )

    this.setState({
      node: {
        childNodes: children.map((childNode: sdk.IDelegationNode) => {
          return {
            childNodes: [],
            delegation: childNode,
            myNode: false,
          } as DelegationsTreeNode
        }),
        delegation,
        myNode: node.myNode,
      } as DelegationsTreeNode,
    })
  }
}

export default DelegationNode
