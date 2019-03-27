import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import BlockchainService from '../../services/BlockchainService'
import { MyDelegation } from '../../state/ducks/Delegations'
import * as Delegations from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import SelectAction, { Action } from '../SelectAction/SelectAction'

type Props = {
  delegationEntry?: MyDelegation

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
    const { delegationEntry, onInvite } = this.props

    if (!delegationEntry) {
      return undefined
    }

    const { permissions, type } = delegationEntry

    const canDelegate =
      !!permissions && permissions.indexOf(sdk.Permission.DELEGATE) !== -1

    if (
      onInvite &&
      this.isMine() &&
      (type === Delegations.DelegationType.Root || canDelegate)
    ) {
      return {
        callback: onInvite.bind(delegationEntry),
        label: 'Invite contact',
      }
    }
    return undefined
  }

  private getDeleteAction() {
    const { delegationEntry, onDelete } = this.props

    if (onDelete && this.isMine()) {
      return {
        callback: onDelete.bind(delegationEntry),
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
    const { delegationEntry } = this.props
    if (!delegationEntry) {
      return undefined
    }
    return !!Delegations.getDelegation(
      PersistentStore.store.getState(),
      delegationEntry.id
    )
  }
}

export default SelectDelegationAction
