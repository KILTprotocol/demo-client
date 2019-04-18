import * as sdk from '@kiltprotocol/prototype-sdk'
import { Blockchain } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import BlockchainService from '../../services/BlockchainService'
import DelegationsService from '../../services/DelegationsService'
import errorService from '../../services/ErrorService'
import FeedbackService, {
  notify,
  notifyFailure,
  notifySuccess,
} from '../../services/FeedbackService'
import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'
import {
  BlockingNotification,
  NotificationType,
} from '../../types/UserFeedback'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import { ModalType } from '../Modal/Modal'
import MyDelegationsInviteModal from '../MyDelegationsInviteModal/MyDelegationsInviteModal'
import Permissions from '../Permissions/Permissions'
import SelectDelegationAction from '../SelectDelegationAction/SelectDelegationAction'
import ShortHash from '../ShortHash/ShortHash'
import Spinner from '../Spinner/Spinner'

import './DelegationNode.scss'

export enum ViewType {
  Present = 'present',
  OnCreation = 'onCreation',
}

export type DelegationsTreeNode = {
  delegation: sdk.IDelegationNode | sdk.IDelegationRootNode
  childNodes: DelegationsTreeNode[]
}

type Props = {
  node: DelegationsTreeNode
  selectedIdentity: MyIdentity
  focusedNodeId: DelegationsTreeNode['delegation']['id']

  editable?: boolean
  focusedNodeAlias?: MyDelegation['metaData']['alias']
  gotSiblings?: true
  gettingSiblings?: boolean
  isMyChild?: boolean
  viewType?: ViewType

  onGetChildren?: () => void
}

type State = {
  node: DelegationsTreeNode

  attestationHashes: string[]
  delegationForInvite?: MyDelegation
  editable?: boolean
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
      attestationHashes: [],
      node: props.node,
    }

    this.getChildren = this.getChildren.bind(this)
    this.getSiblings = this.getSiblings.bind(this)
    this.cancelInvite = this.cancelInvite.bind(this)
    this.confirmInvite = this.confirmInvite.bind(this)
    this.revokeAttestations = this.revokeAttestations.bind(this)
    this.revokeDelegation = this.revokeDelegation.bind(this)
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

    BlockchainService.connect().then((blockchain: Blockchain) => {
      node.delegation
        .getAttestationHashes(blockchain)
        .then((attestationHashes: string[]) => {
          this.setState({ attestationHashes })
        })
    })
  }

  public render() {
    const {
      editable,
      focusedNodeAlias,
      focusedNodeId,
      isMyChild,
      selectedIdentity,
      viewType,
    } = this.props
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
    const { permissions, revoked } = delegation as sdk.IDelegationNode

    return (
      <section
        className={`DelegationNode
          ${!node.childNodes.length ? 'hasNoChildren' : ''}
          ${myNode ? 'myNode' : ''}
          ${focusedNode ? 'focusedNode' : ''}
          ${editable ? 'editable' : ''}
          viewType-${viewType}
          ${revoked ? 'revoked' : ''}
        `}
      >
        <div className="label">
          <div className="header">
            {myDelegation && <h3>{myDelegation.metaData.alias}</h3>}
            {!myDelegation && !!focusedNodeAlias && focusedNode && (
              <h3>{focusedNodeAlias}</h3>
            )}
            <ShortHash length={10}>{delegation.id}</ShortHash>
            {editable && (
              <SelectDelegationAction
                className={`minimal ${focusedNode ? 'inverted' : ''}`}
                delegation={node.delegation}
                isMyChild={isMyChild}
                onInvite={this.inviteTo.bind(this, myDelegation)}
                onRevokeAttestations={this.revokeAttestations}
                onRevokeDelegation={this.revokeDelegation}
              />
            )}
            {editable && viewType === ViewType.Present && (
              <span
                className="attestedClaims"
                title={`${
                  attestationHashes.length
                } attested claims created with this delegation`}
              >
                ({attestationHashes.length})
              </span>
            )}
          </div>
          <div className="content">
            <ContactPresentation
              address={delegation.account}
              interactive={true}
            />
            {!!permissions && <Permissions permissions={permissions} />}
          </div>
          {viewType === ViewType.Present && revoked && (
            <div className="revokedLabel">REVOKED</div>
          )}
        </div>
        {viewType === ViewType.Present && this.getElement_getSiblings()}
        {viewType === ViewType.Present && this.getElement_getChildren()}
        {node.childNodes.map((childNode: DelegationsTreeNode) => (
          <DelegationNode
            key={childNode.delegation.id}
            selectedIdentity={selectedIdentity}
            editable={editable}
            node={childNode}
            focusedNodeId={focusedNodeId}
            focusedNodeAlias={focusedNodeAlias}
            gotSiblings={gotChildren}
            gettingSiblings={gettingChildren}
            viewType={viewType}
            isMyChild={myNode || isMyChild}
            onGetChildren={this.getChildren}
          />
        ))}
        {editable && viewType === ViewType.Present && delegationForInvite && (
          <MyDelegationsInviteModal
            delegationsSelected={[delegationForInvite]}
            isPCR={!!delegationForInvite.isPCR}
            onCancel={this.cancelInvite}
            onConfirm={this.confirmInvite}
          />
        )}
      </section>
    )
  }

  private getElement_getChildren() {
    const { gettingChildren, gotChildren, node } = this.state
    const { delegation } = node
    const { permissions } = delegation as sdk.IDelegationNode

    if (permissions && permissions.indexOf(sdk.Permission.DELEGATE) === -1) {
      return
    }

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

    const { myDelegation } = this.state

    const blockchain = await BlockchainService.connect()
    const hashes = await delegation.getAttestationHashes(blockchain)

    const delegationTitle = (
      <span>
        <strong>
          {myDelegation ? `${myDelegation.metaData.alias}: ` : ''}
        </strong>
        <ShortHash>{delegation.id}</ShortHash>
      </span>
    )
    notify(
      <span>Start revoking Attestations for Delegation: {delegationTitle}</span>
    )

    Promise.all(
      hashes.map(hash =>
        sdk.Attestation.revoke(blockchain, hash, selectedIdentity.identity)
      )
    )
      .then(() => {
        notifySuccess(
          <span>
            All Attestations revoked for Delegation: {delegationTitle}
          </span>,
          true
        )
      })
      .catch(err => {
        errorService.log(err)
        notifyFailure(
          <span>
            Something went wrong, while revoking Attestations for Delegation:{' '}
            {delegationTitle}. Please try again
          </span>
        )
      })
  }

  private async revokeDelegation() {
    const { selectedIdentity, node } = this.props

    FeedbackService.addBlockingNotification({
      header: 'Revoke this delegation?',
      message: (
        <div>
          Are you sure you want to revoke the Delegation '
          <ShortHash>{node.delegation.id}</ShortHash>'?
        </div>
      ),
      modalType: ModalType.CONFIRM,
      okButtonLabel: 'Revoke',
      onCancel: (notification: BlockingNotification) => notification.remove(),
      onConfirm: async (notification: BlockingNotification) => {
        notification.remove()
        const blockchain = await BlockchainService.connect()
        const blockUi = FeedbackService.addBlockUi({
          headline: 'Revoking delegation',
        })

        DelegationsService.revoke(node.delegation, selectedIdentity.identity)
          .then(() => {
            node.delegation.revoked = true
            this.setState({
              node,
            })

            blockUi.remove()
            notifySuccess(<span>Delegation successfully revoked</span>, true)
          })
          .catch(error => {
            blockUi.remove()
            errorService.log(error)
            notifyFailure(
              <span>
                Something went wrong, while revoking the Delegation. Please try
                again
              </span>
            )
          })
      },
      type: NotificationType.FAILURE,
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
