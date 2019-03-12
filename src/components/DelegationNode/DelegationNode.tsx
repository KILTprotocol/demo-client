import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import ContactPresentation from '../ContactPresentation/ContactPresentation'

import './DelegationNode.scss'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

export interface DelegationsTreeNode extends sdk.IDelegationNode {
  cTypeHash?: sdk.IDelegationRootNode['ctypeHash']
  childNodes: DelegationsTreeNode[]
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
    const { permissions, cTypeHash } = node

    return (
      <section
        className={`DelegationNode ${
          !node.childNodes.length ? 'hasNoChildren' : ''
        } ${cTypeHash ? 'isRoot' : ''}`}
      >
        {cTypeHash && (
          <h2>
            CType: <CTypePresentation cTypeHash={cTypeHash} />
          </h2>
        )}
        <ContactPresentation address={node.account} />
        {permissions && this.getPermissions()}
        {onGetChildren && (
          <button className="getSiblings" onClick={this.getSiblings} />
        )}
        {!node.childNodes.length && (
          <button className="getChildren" onClick={this.getChildren} />
        )}
        {node.childNodes.map((childNode: DelegationsTreeNode) => (
          <DelegationNode
            key={node.id}
            node={childNode}
            onGetChildren={this.getChildren}
          />
        ))}
      </section>
    )
  }

  private getPermissions() {
    const { node } = this.state
    const { permissions } = node
    const possiblePermissions = ['canAttest', 'canDelegate']

    return (
      <div className="permissions">
        {possiblePermissions.map(possiblePermission => {
          const allowed = permissions.indexOf(possiblePermission) !== -1

          return (
            <span
              key={possiblePermission}
              title={possiblePermission
                .toLowerCase()
                .replace('can', allowed ? 'can ' : 'can NOT ')}
              className={`${possiblePermission} ${
                allowed ? 'allowed' : 'denied'
              }`}
            />
          )
        })}
      </div>
    )
  }

  private getSiblings() {
    const { onGetChildren } = this.props
    if (onGetChildren) {
      onGetChildren()
    }
  }

  private getChildren() {
    const { node } = this.state
    node.getChildren().then((childNodes: sdk.IDelegationNode[]) => {
      const childTreeNodes = childNodes.map(
        (childNode: sdk.IDelegationNode) => {
          return {
            ...childNode,
            childNodes: [],
          }
        }
      )

      this.setState({
        node: {
          ...node,
          childNodes: childTreeNodes,
        },
      })
    })
  }
}

export default DelegationNode
