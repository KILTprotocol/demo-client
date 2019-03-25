import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import BlockchainService from '../../services/BlockchainService'
import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import MyDelegationsInviteModal from '../MyDelegationsInviteModal/MyDelegationsInviteModal'
import SelectAction, { Action } from '../SelectAction/SelectAction'
import ShortHash from '../ShortHash/ShortHash'
import Spinner from '../Spinner/Spinner'

import './DelegationNode.scss'

export type DelegationsTreeNode = {
  delegation: sdk.IDelegationNode | sdk.IDelegationRootNode
  childNodes: DelegationsTreeNode[]
}

type Props = {
  node: DelegationsTreeNode
  selectedIdentity: MyIdentity
  focusedNodeId: DelegationsTreeNode['delegation']['id']

  gotSiblings?: true
  gettingSiblings?: boolean

  onGetChildren?: () => void
}

type State = {
  node: DelegationsTreeNode

  delegationForInvite?: MyDelegation
  focusedNode?: boolean
  gettingChildren?: boolean
  gotChildren?: true
  isRoot?: boolean
  myDelegation?: MyDelegation
  myNode?: boolean
}

class DelegationNode extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      node: props.node,
    }

    this.getChildren = this.getChildren.bind(this)
    this.getSiblings = this.getSiblings.bind(this)
    this.cancelInvite = this.cancelInvite.bind(this)
    this.confirmInvite = this.confirmInvite.bind(this)
  }

  public componentDidMount() {
    const { focusedNodeId, selectedIdentity } = this.props
    const { node } = this.state

    const myDelegation = Delegations.getDelegation(
      PersistentStore.store.getState(),
      node.delegation.id
    )

    this.setState({
      focusedNode: node.delegation.id === focusedNodeId,
      isRoot: !!(node.delegation as sdk.IDelegationRootNode).cTypeHash,
      myDelegation,
      myNode: node.delegation.account === selectedIdentity.identity.address,
    })
  }

  public render() {
    const { focusedNodeId, selectedIdentity } = this.props
    const {
      delegationForInvite,
      focusedNode,
      gettingChildren,
      gotChildren,
      myDelegation,
      myNode,
      node,
    } = this.state
    const { delegation } = node
    const { permissions } = delegation as sdk.IDelegationNode

    const actions = this.getActions()

    return (
      <section
        key={delegation.id}
        className={`DelegationNode
          ${!node.childNodes.length ? 'hasNoChildren' : ''}
          ${myNode ? 'myNode' : ''}
          ${focusedNode ? 'focusedNode' : ''}
        `}
      >
        <div className="label">
          <div className="header">
            {myDelegation && <h3>{myDelegation.metaData.alias}</h3>}
            <ShortHash length={10}>{delegation.id}</ShortHash>
          </div>
          <div className="content">
            <ContactPresentation address={delegation.account} />
            {permissions && this.getPermissions()}
            {!!actions.length && (
              <SelectAction
                actions={actions}
                className={`minimal ${focusedNode ? 'inverted' : ''}`}
              />
            )}
          </div>
        </div>
        {this.getElement_getSiblings()}
        {this.getElement_getChildren()}
        {node.childNodes.map((childNode: DelegationsTreeNode) => (
          <DelegationNode
            selectedIdentity={selectedIdentity}
            key={childNode.delegation.id}
            node={childNode}
            focusedNodeId={focusedNodeId}
            onGetChildren={this.getChildren}
            gotSiblings={gotChildren}
            gettingSiblings={gettingChildren}
          />
        ))}
        {delegationForInvite && (
          <MyDelegationsInviteModal
            delegationsSelected={[delegationForInvite]}
            onCancel={this.cancelInvite}
            onConfirm={this.confirmInvite}
          />
        )}
      </section>
    )
  }

  private getElement_getChildren() {
    const { gettingChildren, gotChildren, node } = this.state

    const classes = [
      'getChildren',
      gotChildren ? 'got' : '',
      gettingChildren ? 'getting' : '',
    ]

    return (
      !node.childNodes.length &&
      (gettingChildren ? (
        <Spinner
          className={classes.join(' ')}
          size={20}
          color="#ef5a28"
          strength={3}
        />
      ) : (
        <button className={classes.join(' ')} onClick={this.getChildren} />
      ))
    )
  }

  private getElement_getSiblings() {
    const { gettingSiblings, gotSiblings, onGetChildren } = this.props

    const classes = [
      'getSiblings',
      gotSiblings ? 'got' : '',
      gettingSiblings ? 'getting' : '',
    ]

    return (
      onGetChildren &&
      (gettingSiblings ? (
        <Spinner
          className={classes.join(' ')}
          size={20}
          color="#ef5a28"
          strength={3}
        />
      ) : (
        <button className={classes.join(' ')} onClick={this.getSiblings} />
      ))
    )
  }

  private getPermissions() {
    const { node } = this.state
    const { delegation } = node
    const { permissions } = delegation as sdk.IDelegationNode

    return (
      <div className="permissions">
        {Object.keys(sdk.Permission)
          .filter(
            (permission: string) =>
              typeof sdk.Permission[permission] === 'number'
          )
          .map((permission: string) => {
            const allowed =
              permissions.indexOf(sdk.Permission[permission]) !== -1
            return (
              <span
                key={permission}
                title={this.getPermissionTitle(permission, allowed)}
                className={`${permission} ${allowed ? 'allowed' : 'denied'}`}
              />
            )
          })}
      </div>
    )
  }

  private getPermissionTitle(permission: string, allowed: boolean): string {
    if (allowed) {
      return 'can ' + permission.toLowerCase()
    }
    return 'can NOT ' + permission.toLowerCase()
  }

  private getSiblings() {
    const { onGetChildren } = this.props
    if (onGetChildren) {
      onGetChildren()
    }
  }

  private getActions(): Action[] {
    const { isRoot, myDelegation, node } = this.state
    const { delegation } = node
    const { permissions } = delegation as sdk.IDelegationNode

    const actions: Action[] = []

    const canDelegate =
      !!permissions && permissions.indexOf(sdk.Permission.DELEGATE) !== -1
    if (myDelegation && (isRoot || canDelegate)) {
      actions.push({
        callback: this.inviteTo.bind(this, myDelegation),
        label: 'Invite contact',
      })
    }

    return actions
  }

  private inviteTo(delegationForInvite: State['delegationForInvite']) {
    this.setState({
      delegationForInvite,
    })
  }

  private cancelInvite() {
    this.setState({
      delegationForInvite: undefined,
    })
  }

  private confirmInvite() {
    this.setState({
      delegationForInvite: undefined,
    })
  }

  private async getChildren() {
    const { node } = this.state
    const { delegation } = node
    const blockchain = await BlockchainService.connect()
    this.setState({
      gettingChildren: true,
    })
    const children: sdk.IDelegationNode[] = await delegation.getChildren(
      blockchain
    )

    this.setState({
      gettingChildren: false,
      gotChildren: true,
      node: {
        childNodes: children.map((childNode: sdk.IDelegationNode) => {
          return {
            childNodes: [],
            delegation: childNode,
          } as DelegationsTreeNode
        }),
        delegation,
      } as DelegationsTreeNode,
    })
  }
}

export default DelegationNode
