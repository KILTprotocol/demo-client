import * as sdk from '@kiltprotocol/sdk-js'
import * as React from 'react'
import { connect } from 'react-redux'
import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation } from '../../state/ducks/Delegations'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import SelectAction, { Action } from '../SelectAction/SelectAction'

type Props = {
  delegation: sdk.IDelegationNode | sdk.IDelegationRootNode | MyDelegation

  className?: string
  isMyChild?: boolean

  onInvite?: (delegationEntry: MyDelegation) => void
  onDelete?: (delegationEntry: MyDelegation) => void
  onRevokeAttestations?: () => void
  onRevokeDelegation?: () => void

  // mapStateToProps
  debugMode: boolean
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
    const { debugMode, delegation, onInvite } = this.props

    if (!delegation || !onInvite) {
      return undefined
    }

    if (
      debugMode ||
      (!delegation.revoked &&
        this.isMine() &&
        SelectDelegationAction.canDelegate(delegation))
    ) {
      return {
        callback: onInvite.bind(delegation),
        label: 'Invite contact',
      }
    }
    return undefined
  }

  private getDeleteAction() {
    const { debugMode, delegation, onDelete } = this.props

    if (!delegation || !onDelete) {
      return undefined
    }

    if (debugMode || this.isMine()) {
      return {
        callback: onDelete.bind(delegation),
        label: 'Delete',
      }
    }
    return undefined
  }

  private getRevokeAttestationsAction() {
    const {
      debugMode,
      delegation,
      isMyChild,
      onRevokeAttestations,
    } = this.props

    if (!delegation || !onRevokeAttestations) {
      return undefined
    }

    if (debugMode || (!delegation.revoked && (this.isMine() || isMyChild))) {
      return {
        callback: onRevokeAttestations,
        label: 'Revoke all Attestations',
      }
    }
    return undefined
  }

  private getRevokeDelegationAction() {
    const { debugMode, delegation, isMyChild, onRevokeDelegation } = this.props
    if (!delegation || !onRevokeDelegation) {
      return undefined
    }

    if (debugMode || (!delegation.revoked && (this.isMine() || isMyChild))) {
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

const mapStateToProps = (state: ReduxState) => ({
  debugMode: UiState.getDebugMode(state),
})

export default connect(mapStateToProps)(SelectDelegationAction)
