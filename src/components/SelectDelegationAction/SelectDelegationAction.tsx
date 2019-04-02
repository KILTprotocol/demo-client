import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import SelectAction, { Action } from '../SelectAction/SelectAction'
import {IDelegationBaseNode} from "@kiltprotocol/prototype-sdk";

type Props = {
  delegation: sdk.IDelegationNode | sdk.IDelegationRootNode | MyDelegation

  className?: string

  onInvite?: (delegationEntry: MyDelegation) => void
  onDelete?: (delegationEntry: MyDelegation) => void
  onRevokeAttestations?: () => void
  onRevokeDelegation?: () => void
}

class SelectDelegationAction extends React.Component<Props> {
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
    const { delegation, onRevokeAttestations } = this.props

    if (!delegation || delegation.revoked) {
      return undefined
    }

    if (onRevokeAttestations) {
      return {
        callback: onRevokeAttestations,
        label: 'Revoke all Attestations',
      }
    }
    return undefined
  }

  private getRevokeDelegationAction() {
    const { delegation, onRevokeDelegation } = this.props
    if (!delegation || delegation.revoked) {
      return undefined
    }
    const { permissions, type } = delegation as MyDelegation

    const canDelegate =
      !!permissions && permissions.indexOf(sdk.Permission.DELEGATE) !== -1

    if (
      this.isMine() &&
      (type === Delegations.DelegationType.Root || canDelegate) &&
      onRevokeDelegation
    ) {
      return {
        callback: onRevokeDelegation,
        label: 'Revoke delegation',
      }
    }
    return undefined
  }

  private isMine() : boolean {
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
