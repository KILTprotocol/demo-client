import {
  Attestation,
  DelegationNode as SDKDelegationNode,
  DelegationRootNode,
  IDelegationNode,
  MessageBodyType,
  Permission,
} from '@kiltprotocol/sdk-js'
import React from 'react'
import { RequestAcceptDelegationProps } from '../../containers/Tasks/RequestAcceptDelegation/RequestAcceptDelegation'

import BlockchainService from '../../services/BlockchainService'
import DelegationsService from '../../services/DelegationsService'
import errorService from '../../services/ErrorService'
import FeedbackService, {
  notifyFailure,
  notifySuccess,
  notifyError,
} from '../../services/FeedbackService'
import * as Delegations from '../../state/ducks/Delegations'
import { IMyDelegation } from '../../state/ducks/Delegations'
import * as UiState from '../../state/ducks/UiState'
import { persistentStoreInstance } from '../../state/PersistentStore'
import { IMyIdentity } from '../../types/Contact'
import {
  IBlockingNotification,
  BlockUi,
  NotificationType,
} from '../../types/UserFeedback'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import { ModalType } from '../Modal/Modal'
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
  delegation: SDKDelegationNode | DelegationRootNode
  childNodes: DelegationsTreeNode[]
}

type Props = {
  node: DelegationsTreeNode
  selectedIdentity: IMyIdentity
  focusedNodeId: DelegationsTreeNode['delegation']['id']

  editable?: boolean
  focusedNodeAlias?: IMyDelegation['metaData']['alias']
  gotSiblings?: true
  gettingSiblings?: boolean
  isMyChild?: boolean
  viewType?: ViewType

  onGetChildren?: () => void
}

type State = {
  node: DelegationsTreeNode

  attestationHashes: string[]
  editable?: boolean
  focusedNode?: boolean
  gettingChildren?: boolean
  gotChildren?: true
  myDelegation?: IMyDelegation
  myNode?: boolean
}

class DelegationNode extends React.Component<Props, State> {
  private static inviteContactsTo(delegation: IMyDelegation): void {
    persistentStoreInstance.store.dispatch(
      UiState.Store.updateCurrentTaskAction({
        objective: MessageBodyType.REQUEST_ACCEPT_DELEGATION,
        props: {
          cTypeHash: delegation.cTypeHash,
          isPCR: !!delegation.isPCR,
          selectedDelegations: [delegation],
        } as RequestAcceptDelegationProps,
      })
    )
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      attestationHashes: [],
      node: props.node,
    }

    this.getChildren = this.getChildren.bind(this)
    this.getSiblings = this.getSiblings.bind(this)
    this.revokeAttestations = this.revokeAttestations.bind(this)
    this.revokeDelegation = this.revokeDelegation.bind(this)
  }

  public componentDidMount(): void {
    const { focusedNodeId, selectedIdentity } = this.props
    const { node } = this.state

    const myDelegation = Delegations.getDelegation(
      persistentStoreInstance.store.getState(),
      node.delegation.id
    )

    this.setState({
      focusedNode: node.delegation.id === focusedNodeId,
      myDelegation,
      myNode: node.delegation.account === selectedIdentity.identity.address,
    })

    BlockchainService.connect().then(() => {
      node.delegation
        .getAttestationHashes()
        .then((attestationHashes: string[]) => {
          this.setState({ attestationHashes })
        })
    })
  }

  private getElementGetChildren(): false | JSX.Element | null {
    const { gettingChildren, gotChildren, node } = this.state
    const { delegation } = node
    const { permissions } = delegation as IDelegationNode

    if (permissions && !permissions.includes(Permission.DELEGATE)) {
      return null
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
        <button
          type="button"
          className={classes.join(' ')}
          onClick={this.getChildren}
        />
      ))
    )
  }

  private getElementGetSiblings(): JSX.Element | undefined {
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
        <button
          type="button"
          className={classes.join(' ')}
          onClick={this.getSiblings}
        />
      ))
    )
  }

  private getSiblings(): void {
    const { onGetChildren } = this.props
    if (onGetChildren) {
      onGetChildren()
    }
  }

  private async getChildren(): Promise<void> {
    const { node } = this.state
    const { delegation } = node
    this.setState({
      gettingChildren: true,
    })
    const children: IDelegationNode[] = await delegation.getChildren()

    this.setState({
      gettingChildren: false,
      gotChildren: true,
      node: {
        childNodes: children.map((childNode: SDKDelegationNode) => {
          return {
            childNodes: [],
            delegation: childNode,
          } as DelegationsTreeNode
        }),
        delegation,
      } as DelegationsTreeNode,
    })
  }

  private revokeDelegation(): void {
    const { selectedIdentity, node } = this.props

    FeedbackService.addBlockingNotification({
      header: 'Revoke this delegation?',
      message: (
        <div>
          Are you sure you want to revoke the Delegation &apos;
          <ShortHash>{node.delegation.id}</ShortHash>&apos;?
        </div>
      ),
      modalType: ModalType.CONFIRM,
      okButtonLabel: 'Revoke',
      onCancel: (notification: IBlockingNotification) => notification.remove(),
      onConfirm: (notification: IBlockingNotification) => {
        notification.remove()
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
            notifyError(error)
          })
      },
      type: NotificationType.FAILURE,
    })
  }

  private async revokeAttestations(): Promise<void> {
    const {
      node: { delegation },
      selectedIdentity,
    } = this.props

    const { myDelegation } = this.state

    const hashes = await delegation.getAttestationHashes()

    const delegationTitle = (
      <span>
        <strong>
          {myDelegation ? `${myDelegation.metaData.alias}: ` : ''}
        </strong>
        <ShortHash>{delegation.id}</ShortHash>
      </span>
    )

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: `Revoking Attestations for Delegation \n'${
        myDelegation
          ? myDelegation.metaData.alias
          : `${delegation.id.substr(0, 10)} …`
      }'`,
    })

    Promise.chain(
      hashes.map((hash: string, index: number) => () => {
        blockUi.updateMessage(`Revoking ${index + 1} / ${hashes.length}`)
        return Attestation.revoke(hash, selectedIdentity.identity).catch(
          error => {
            // Promise.chain works with thrown object literals
            // eslint-disable-next-line no-throw-literal
            throw { hash, error }
          }
        )
      }),
      true
    ).then(result => {
      blockUi.remove()
      if (result.successes.length) {
        notifySuccess(
          <span>
            Successfully revoked {result.successes.length}
            {result.successes.length > 1 ? ' attestations ' : ' attestation '}
            for Delegation: {delegationTitle}
          </span>,
          false
        )
      }
      if (result.errors.length) {
        notifyFailure(
          <span>
            Could not revoke {result.errors.length}
            {result.errors.length > 1 ? ' attestations ' : ' attestation '}
            for Delegation: {delegationTitle}. Maybe they were already revoked.
            For details refer to console.
          </span>,
          false
        )
        console.error('revocation errors', result.errors)
      }
    })
  }

  public render(): JSX.Element {
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
      focusedNode,
      gettingChildren,
      gotChildren,
      myDelegation,
      myNode,
      node,
    } = this.state
    const { delegation } = node
    const { permissions, revoked } = delegation as IDelegationNode

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
                onInvite={() =>
                  myDelegation && DelegationNode.inviteContactsTo(myDelegation)
                }
                onRevokeAttestations={this.revokeAttestations}
                onRevokeDelegation={this.revokeDelegation}
              />
            )}
            {editable && viewType === ViewType.Present && (
              <span
                className="attestedClaims"
                title={`${attestationHashes.length} attested claims created with this delegation`}
              >
                ({attestationHashes.length})
              </span>
            )}
          </div>
          <div className="content">
            <ContactPresentation address={delegation.account} interactive />
            {!!permissions && <Permissions permissions={permissions} />}
          </div>
          {viewType === ViewType.Present && revoked && (
            <div className="revokedLabel">REVOKED</div>
          )}
        </div>
        {viewType === ViewType.Present && this.getElementGetSiblings()}
        {viewType === ViewType.Present && this.getElementGetChildren()}
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
      </section>
    )
  }
}

export default DelegationNode
