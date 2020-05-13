import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import * as Delegations from '../../state/ducks/Delegations'
import { IMyDelegation } from '../../state/ducks/Delegations'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import SelectAction, { Action } from '../SelectAction/SelectAction'

type StateProps = {
  debugMode: boolean
}

type OwnProps = {
  delegation: sdk.IDelegationNode | sdk.IDelegationRootNode | IMyDelegation

  className?: string
  isMyChild?: boolean

  onInvite?: (delegationEntry: IMyDelegation) => void
  onDelete?: (delegationEntry: IMyDelegation) => void
  onRevokeAttestations?: () => void
  onRevokeDelegation?: () => void
  onQRCode?: (delegationEntry: IMyDelegation) => void
}

type Props = StateProps & OwnProps

class SelectDelegationAction extends React.Component<Props> {
  private static canDelegate(
    delegation: sdk.IDelegationNode | sdk.IDelegationRootNode | IMyDelegation
  ): boolean {
    const permissions = (delegation as sdk.IDelegationNode | IMyDelegation)
      .permissions || [sdk.Permission.ATTEST, sdk.Permission.DELEGATE]
    return !!permissions && permissions.includes(sdk.Permission.DELEGATE)
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

  private getDeleteAction(): Action | undefined {
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

  private getRevokeAttestationsAction(): Action | undefined {
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

  private getRevokeDelegationAction(): Action | undefined {
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

  private getQRCodeAction(): Action | undefined {
    const { delegation, debugMode, onQRCode } = this.props
    if (!delegation || !onQRCode) {
      return undefined
    }

    if (debugMode || (!delegation.revoked && this.isMine())) {
      return {
        callback: onQRCode,
        label: 'Show QR Code',
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

  public render(): JSX.Element {
    const { className } = this.props

    const actions: Array<Action | undefined> = [
      this.getInviteAction(),
      this.getDeleteAction(),
      this.getRevokeDelegationAction(),
      this.getRevokeAttestationsAction(),
      this.getQRCodeAction(),
    ].filter((action: Action) => action)

    return (
      <section className="SelectDelegationAction">
        {!!actions.length && (
          <SelectAction className={className} actions={actions as Action[]} />
        )}
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  debugMode: UiState.getDebugMode(state),
})

export default connect(mapStateToProps)(SelectDelegationAction)
