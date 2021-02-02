import {
  IRequestAcceptDelegation,
  MessageBodyType,
  Permission,
  UUID,
} from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import SelectDelegations from '../../../components/SelectDelegations/SelectDelegations'
import SelectPermissions from '../../../components/SelectPermissions/SelectPermissions'
import MessageRepository from '../../../services/MessageRepository'
import * as Delegations from '../../../state/ducks/Delegations'
import { IMyDelegation } from '../../../state/ducks/Delegations'
import * as UiState from '../../../state/ducks/UiState'
import * as Wallet from '../../../state/ducks/Wallet'
import { State as ReduxState } from '../../../state/PersistentStore'
import { IContact, IMyIdentity } from '../../../types/Contact'
import { ICType } from '../../../types/Ctype'

import './RequestAcceptDelegation.scss'

type Labels = {
  [type: string]: {
    h2: string
    placeholder: string
  }
}

const labels = {
  PCR: {
    h2: 'Select PCR(s)',
    placeholder: 'Select PCR(s)…',
  },
  delegation: {
    h2: 'Select delegation(s)',
    placeholder: 'Select delegation(s)…',
  },
}

export type RequestAcceptDelegationProps = {
  receiverAddresses: Array<IContact['publicIdentity']['address']>
  cTypeHash: ICType['cType']['hash']
  isPCR: boolean

  selectedDelegations?: IMyDelegation[]

  onCancel?: () => void
  onFinished?: () => void
  onMenuClose?: () => void
  onMenuOpen?: () => void
}

type StateProps = {
  debugMode: boolean
  myDelegations: IMyDelegation[]
  selectedIdentity?: IMyIdentity
}

type Props = RequestAcceptDelegationProps & StateProps

type State = {
  permissions: Permission[]
  selectedDelegations: IMyDelegation[]
}

class RequestAcceptDelegation extends React.Component<Props, State> {
  private labels: Labels['delegation'] | Labels['PCR']

  constructor(props: Props) {
    super(props)
    this.state = {
      permissions: props.isPCR ? [1] : [],
      selectedDelegations: props.selectedDelegations || [],
    }

    this.labels = props.isPCR ? labels.PCR : labels.delegation

    this.changeDelegations = this.changeDelegations.bind(this)
    this.changePermissions = this.changePermissions.bind(this)
    this.sendInvitations = this.sendInvitations.bind(this)

    this.onCancel = this.onCancel.bind(this)
    this.onMenuClose = this.onMenuClose.bind(this)
    this.onMenuOpen = this.onMenuOpen.bind(this)
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private onMenuOpen(): void {
    const { onMenuOpen } = this.props
    if (onMenuOpen) {
      onMenuOpen()
    }
  }

  private onMenuClose(): void {
    const { onMenuClose } = this.props
    if (onMenuClose) {
      onMenuClose()
    }
  }

  private getDelegationData(
    receiverAddress: IContact['publicIdentity']['address'],
    delegation: IMyDelegation
  ): IRequestAcceptDelegation['content']['delegationData'] {
    const { isPCR } = this.props
    const { permissions } = this.state

    return {
      account: receiverAddress,
      id: UUID.generate(),
      isPCR,
      parentId: delegation.id,
      permissions,
    }
  }

  private filterDelegations(): Delegations.IMyDelegation[] {
    const { cTypeHash, isPCR, myDelegations, debugMode } = this.props

    if (debugMode) {
      return myDelegations
    }

    return myDelegations.filter(
      (myDelegation: IMyDelegation) =>
        myDelegation.cTypeHash === cTypeHash &&
        !!myDelegation.isPCR === isPCR &&
        !myDelegation.revoked &&
        (!myDelegation.permissions ||
          (myDelegation.permissions &&
            myDelegation.permissions.includes(Permission.DELEGATE)))
    )
  }

  private changePermissions(newPermissions: Permission[]): void {
    this.setState({ permissions: newPermissions })
  }

  private changeDelegations(selectedDelegations: IMyDelegation[]): void {
    this.setState({ selectedDelegations })
  }

  private sendSingleInvitation(
    receiverAddress: IContact['publicIdentity']['address'],
    delegation: Delegations.Entry
  ): void {
    const { selectedIdentity } = this.props
    const { metaData } = delegation

    if (!selectedIdentity) {
      throw new Error('No selected Identity')
    }

    const delegationData = this.getDelegationData(receiverAddress, delegation)

    const messageBody: IRequestAcceptDelegation = {
      content: {
        delegationData,
        metaData,
        signatures: {
          inviter: selectedIdentity.identity.signStr(
            JSON.stringify(delegationData)
          ),
        },
      },
      type: MessageBodyType.REQUEST_ACCEPT_DELEGATION,
    }

    MessageRepository.sendToAddresses([receiverAddress], messageBody)
  }

  private sendInvitations(): void {
    const { receiverAddresses, onFinished } = this.props
    const { selectedDelegations } = this.state

    if (this.isInvitationValid()) {
      receiverAddresses.forEach(
        (receiverAddress: IContact['publicIdentity']['address']) => {
          selectedDelegations.forEach((delegation: Delegations.Entry) => {
            this.sendSingleInvitation(receiverAddress, delegation)
          })
        }
      )

      if (onFinished) {
        onFinished()
      }
    }
  }

  private isInvitationValid(): boolean {
    const { receiverAddresses } = this.props
    const { permissions, selectedDelegations } = this.state
    return !!(
      permissions &&
      permissions.length &&
      selectedDelegations &&
      selectedDelegations.length &&
      receiverAddresses &&
      receiverAddresses.length
    )
  }

  public render(): JSX.Element {
    const { isPCR, selectedDelegations: preSelectedDelegations } = this.props
    const { permissions } = this.state

    const delegations = this.filterDelegations()

    return (
      <section className="RequestAcceptDelegation">
        <section className="selectDelegations">
          <h2>{this.labels.h2}</h2>
          <SelectDelegations
            delegations={delegations}
            name="selectDelegationsForInvite"
            defaultValues={preSelectedDelegations}
            isMulti
            closeMenuOnSelect
            placeholder={this.labels.placeholder}
            onChange={this.changeDelegations}
            onMenuClose={this.onMenuClose}
            onMenuOpen={this.onMenuOpen}
          />
        </section>
        {!isPCR && (
          <SelectPermissions
            permissions={permissions}
            onChange={this.changePermissions}
          />
        )}
        <div className="actions">
          <button type="button" className="cancel" onClick={this.onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="invite"
            disabled={!this.isInvitationValid()}
            onClick={this.sendInvitations}
          >
            Invite
          </button>
        </div>
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  RequestAcceptDelegationProps,
  ReduxState
> = state => ({
  debugMode: UiState.getDebugMode(state),
  myDelegations: Delegations.getAllDelegations(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(RequestAcceptDelegation)
