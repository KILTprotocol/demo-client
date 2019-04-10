import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import SelectAction, { Action } from '../SelectAction/SelectAction'

type Props = {
  delegation: sdk.IDelegationNode | sdk.IDelegationRootNode | MyDelegation

  className?: string
  isMyChild?: boolean

  onInvite?: (delegationEntry: MyDelegation) => void
  onDelete?: (delegationEntry: MyDelegation) => void
  onRevokeAttestations?: () => void
  onRevokeDelegation?: () => void
}

class SelectDelegationAction extends React.Component<Props> {
  private static canDelegate(
    delegation: sdk.IDelegationNode | sdk.IDelegationRootNode | MyDelegation
  ): boolean {
    const permissions = (delegation as sdk.IDelegationNode | MyDelegation)
      .permissions || [sdk.Permission.ATTEST, sdk.Permission.DELEGATE]
    return !!permissions && permissions.indexOf(sdk.Permission.DELEGATE) !== -1
  }
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { className } = this.props

    const actions: Array<Action | undefined> = [
      this.getInviteAction(),
      this.getDeleteAction(),
      this.getRevokeDelegationAction(),
      this.getRevokeAttestationsAction(),
    ].filter((action: Action) => action)

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

    if (!delegation || delegation.revoked) {
      return undefined
    }

    if (
      !!onInvite &&
      this.isMine() &&
      SelectDelegationAction.canDelegate(delegation)
    ) {
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
    const { delegation, isMyChild, onRevokeAttestations } = this.props

    if (!delegation || delegation.revoked) {
      return undefined
    }

    if ((this.isMine() || isMyChild) && onRevokeAttestations) {
      return {
        callback: onRevokeAttestations,
        label: 'Revoke all Attestations',
      }
    }
    return undefined
  }

  private getRevokeDelegationAction() {
    const { delegation, isMyChild, onRevokeDelegation } = this.props
    if (!delegation || delegation.revoked) {
      return undefined
    }

    if ((this.isMine() || isMyChild) && onRevokeDelegation) {
      return {
        callback: onRevokeDelegation,
        label: 'Revoke delegation',
      }
    }
    return undefined
  }

  private isMine(): boolean {
    const { delegation } = this.props
    if (!delegation) {
      return false
    }
    return !!Delegations.getDelegation(
      PersistentStore.store.getState(),
      delegation.id
    )
  }
}

export default SelectDelegationAction
