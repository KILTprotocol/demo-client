import * as sdk from '@kiltprotocol/prototype-sdk'
import { Blockchain } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import BlockchainService from '../../services/BlockchainService'
import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import MyDelegationsInviteModal from '../MyDelegationsInviteModal/MyDelegationsInviteModal'
import Permissions from '../Permissions/Permissions'
import SelectDelegationAction from '../SelectDelegationAction/SelectDelegationAction'
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
  focusedNodeAlias?: MyDelegation['metaData']['alias']

  onGetChildren?: () => void
}

type State = {
  node: DelegationsTreeNode

  attestationHashes: string[]
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
      attestationHashes: [],
    }

    this.getChildren = this.getChildren.bind(this)
    this.getSiblings = this.getSiblings.bind(this)
    this.cancelInvite = this.cancelInvite.bind(this)
    this.confirmInvite = this.confirmInvite.bind(this)
    this.revokeAttestations = this.revokeAttestations.bind(this)
  }

  public componentDidMount() {
    const { focusedNodeId, selectedIdentity } = this.props
    const { node } = this.state

    const myDelegation = Delegations.getDelegation(
      PersistentStore.store.getState(),
      node.delegation.id
    )

    BlockchainService.connect().then((blockchain: Blockchain) => {
      node.delegation
        .getAttestationHashes(blockchain)
        .then((attestationHashes: string[]) => {
          this.setState({
            attestationHashes,
            focusedNode: node.delegation.id === focusedNodeId,
            isRoot: !!(node.delegation as sdk.IDelegationRootNode).cTypeHash,
            myDelegation,
            myNode:
              node.delegation.account === selectedIdentity.identity.address,
          })
        })
    })
  }

  public render() {
    const { focusedNodeAlias, focusedNodeId, selectedIdentity } = this.props
    const {
      attestationHashes,
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
            {!myDelegation && !!focusedNodeAlias && focusedNode && (
              <h3>{focusedNodeAlias}</h3>
            )}
            <ShortHash length={10}>{delegation.id}</ShortHash>
            <span
              className="attestedClaims"
              title={`${
                attestationHashes.length
              } attested claims created with this delegation`}
            >
              ({attestationHashes.length})
            </span>
          </div>
          <div className="content">
            <ContactPresentation address={delegation.account} />
            {!!permissions && <Permissions permissions={permissions} />}
            {!!myDelegation && (
              <SelectDelegationAction
                className={`minimal ${focusedNode ? 'inverted' : ''}`}
                delegationEntry={myDelegation}
                onInvite={this.inviteTo.bind(this, myDelegation)}
                onRevokeAttestations={this.revokeAttestations}
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
            focusedNodeAlias={focusedNodeAlias}
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

  private getSiblings() {
    const { onGetChildren } = this.props
    if (onGetChildren) {
      onGetChildren()
    }
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

  private async revokeAttestations() {
    const {
      selectedIdentity,
      node: { delegation },
    } = this.props

    const blockchain = await BlockchainService.connect()
    const hashes = await delegation.getAttestationHashes(blockchain)

    Promise.all(
      hashes.map(hash =>
        sdk.Attestation.revoke(blockchain, hash, selectedIdentity.identity)
      )
    )
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
