import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'

import SelectDelegations from '../../../components/SelectDelegations/SelectDelegations'
import SelectPermissions from '../../../components/SelectPermissions/SelectPermissions'
import MessageRepository from '../../../services/MessageRepository'
import * as Delegations from '../../../state/ducks/Delegations'
import { MyDelegation } from '../../../state/ducks/Delegations'
import * as UiState from '../../../state/ducks/UiState'
import * as Wallet from '../../../state/ducks/Wallet'
import { State as ReduxState } from '../../../state/PersistentStore'
import { Contact, MyIdentity } from '../../../types/Contact'
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
  receiverAddresses: Array<Contact['publicIdentity']['address']>
  cTypeHash: ICType['cType']['hash']
  isPCR: boolean

  selectedDelegations?: MyDelegation[]

  onCancel?: () => void
  onFinished?: () => void
  onMenuClose?: () => void
  onMenuOpen?: () => void
}

type Props = RequestAcceptDelegationProps & {
  // redux
  debugMode: boolean
  myDelegations: MyDelegation[]
  selectedIdentity: MyIdentity
}

type State = {
  delegations: MyDelegation[]
  permissions: sdk.Permission[]
  selectedDelegations: MyDelegation[]
}

class RequestAcceptDelegation extends React.Component<Props, State> {
  private labels: Labels['delegation'] | Labels['PCR']

  constructor(props: Props) {
    super(props)
    this.state = {
      delegations: [],
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

  public render() {
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
            isMulti={true}
            closeMenuOnSelect={true}
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
          <button className="cancel" onClick={this.onCancel}>
            Cancel
          </button>
          <button
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

  private filterDelegations() {
    const { cTypeHash, isPCR, myDelegations, debugMode } = this.props

    if (debugMode) {
      return myDelegations
    }

    return myDelegations.filter(
      (myDelegation: MyDelegation) =>
        myDelegation.cTypeHash === cTypeHash &&
        !!myDelegation.isPCR === isPCR &&
        !myDelegation.revoked &&
        (!myDelegation.permissions ||
          (myDelegation.permissions &&
            myDelegation.permissions.indexOf(sdk.Permission.DELEGATE) !== -1))
    )
  }

  private changePermissions(newPermissions: sdk.Permission[]) {
    this.setState({ permissions: newPermissions })
  }

  private changeDelegations(selectedDelegations: MyDelegation[]) {
    this.setState({ selectedDelegations })
  }

  private getDelegationData(
    receiverAddress: Contact['publicIdentity']['address'],
    delegation: MyDelegation
  ): sdk.IRequestAcceptDelegation['content']['delegationData'] {
    const { isPCR } = this.props
    const { permissions } = this.state

    return {
      account: receiverAddress,
      id: sdk.UUID.generate(),
      isPCR,
      parentId: delegation.id,
      permissions,
    }
  }

  private sendSingleInvitation(
    receiverAddress: Contact['publicIdentity']['address'],
    delegation: Delegations.Entry
  ) {
    const { selectedIdentity } = this.props
    const { metaData } = delegation

    const delegationData = this.getDelegationData(receiverAddress, delegation)

    const messageBody: sdk.IRequestAcceptDelegation = {
      content: {
        delegationData,
        metaData,
        signatures: {
          inviter: selectedIdentity.identity.signStr(
            JSON.stringify(delegationData)
          ),
        },
      },
      type: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION,
    }

    MessageRepository.sendToAddresses([receiverAddress], messageBody)
  }

  private sendInvitations() {
    const { receiverAddresses, onFinished } = this.props
    const { selectedDelegations } = this.state

    if (this.isInvitationValid()) {
      receiverAddresses.forEach(
        (receiverAddress: Contact['publicIdentity']['address']) => {
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

  private isInvitationValid() {
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

  private onCancel() {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private onMenuOpen() {
    const { onMenuOpen } = this.props
    if (onMenuOpen) {
      onMenuOpen()
    }
  }

  private onMenuClose() {
    const { onMenuClose } = this.props
    if (onMenuClose) {
      onMenuClose()
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  debugMode: UiState.getDebugMode(state),
  myDelegations: Delegations.getAllDelegations(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(RequestAcceptDelegation)
