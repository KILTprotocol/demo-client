import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import BlockchainService from '../../services/BlockchainService'
import { MyDelegation } from '../../state/ducks/Delegations'
import * as Delegations from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import SelectAction, { Action } from '../SelectAction/SelectAction'

type Props = {
  delegation: sdk.IDelegationNode | sdk.IDelegationRootNode | MyDelegation

  className?: string

  onInvite?: (delegationEntry: MyDelegation) => void
  onDelete?: (delegationEntry: MyDelegation) => void
  onRevokeAttestations?: () => void
}

type State = {
  actions: Array<Action | undefined>
}

class SelectDelegationAction extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      actions: [],
    }
  }

  public componentDidMount() {
    const actions: State['actions'] = [
      this.getInviteAction(),
      this.getDeleteAction(),
      this.getRevokeAttestationsAction(),
    ].filter((action: Action) => action)
    this.setState({ actions })
  }

  public render() {
    const { className } = this.props
    const { actions } = this.state

    return (
      <section className="SelectDelegationAction">
        {!!actions.length && (
          <SelectAction className={className} actions={actions as Action[]} />
        )}
      </section>
    )
  }

  private getInviteAction(): Action | undefined {
    const { delegation, onInvite } = this.props

    if (!delegation) {
      return undefined
    }

    const permissions = (delegation as sdk.IDelegationNode).permissions || [
      sdk.Permission.ATTEST,
      sdk.Permission.DELEGATE,
    ]

    const canDelegate =
      !!permissions && permissions.indexOf(sdk.Permission.DELEGATE) !== -1

    if (!!onInvite && this.isMine() && canDelegate) {
      return {
        callback: onInvite.bind(delegation),
        label: 'Invite contact',
      }
    }
    return undefined
  }

  private getDeleteAction() {
    const { delegation, onDelete } = this.props

    if (onDelete && this.isMine()) {
      return {
        callback: onDelete.bind(delegation),
        label: 'Delete',
      }
    }
    return undefined
  }

  private getRevokeAttestationsAction() {
    const { onRevokeAttestations } = this.props

    if (onRevokeAttestations) {
      return {
        callback: onRevokeAttestations,
        label: 'Revoke all Attestations',
      }
    }
    return undefined
  }

  private isMine() {
    const { delegation } = this.props
    if (!delegation) {
      return undefined
    }
    return !!Delegations.getDelegation(
      PersistentStore.store.getState(),
      delegation.id
    )
  }
}

export default SelectDelegationAction
