import {
  IDelegationNode,
  IDelegationRootNode,
  ISubmitAcceptDelegation,
} from '@kiltprotocol/types'
import { Crypto } from '@kiltprotocol/utils'
import { DelegationNode } from '@kiltprotocol/sdk-js'

import React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import ContactPresentation from '../../../components/ContactPresentation/ContactPresentation'
import DelegationDetailView from '../../../components/DelegationDetailView/DelegationDetailView'
import Permissions from '../../../components/Permissions/Permissions'
import Spinner from '../../../components/Spinner/Spinner'
import AttestationWorkflow from '../../../services/AttestationWorkflow'
import DelegationService from '../../../services/DelegationsService'
import errorService from '../../../services/ErrorService'
import FeedbackService, {
  notifySuccess,
  notifyFailure,
  notifyError,
} from '../../../services/FeedbackService'
import { IMyDelegation } from '../../../state/ducks/Delegations'
import * as Delegations from '../../../state/ducks/Delegations'
import { State as ReduxState } from '../../../state/PersistentStore'
import { IContact } from '../../../types/Contact'
import { BlockUi } from '../../../types/UserFeedback'

import './CreateDelegation.scss'

type StateProps = {
  myDelegations: IMyDelegation[]
}

type OwnProps = {
  delegationData: ISubmitAcceptDelegation['content']['delegationData']
  inviteeAddress: IContact['publicIdentity']['address']
  inviterAddress: IContact['publicIdentity']['address']
  signatures: ISubmitAcceptDelegation['content']['signatures']

  onCancel?: () => void
  onFinished?: () => void
}

type Props = StateProps & OwnProps

type State = {
  isSignatureValid?: boolean
}

class CreateDelegation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.onCancel = this.onCancel.bind(this)
    this.createDelegation = this.createDelegation.bind(this)
  }

  public componentDidMount(): void {
    // TODO: check inviters signature?
    this.checkSignature()
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private async createDelegation(): Promise<void> {
    const { delegationData, signatures } = this.props
    const { account, id, isPCR, parentId, permissions } = delegationData

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: `Creating ${isPCR ? 'PCR member' : 'delegation'}`,
    })

    const rootNode: IDelegationRootNode | null = await DelegationService.findRootNode(
      parentId
    )
    if (!rootNode) {
      notifyFailure(`${isPCR ? 'PCR root' : 'Root delegation'} not found`)
      return
    }
    const rootId = rootNode.id
    let optionalParentId: IDelegationNode['parentId']
    if (rootId !== parentId) {
      optionalParentId = parentId
    }

    const newDelegationNode = new DelegationNode({
      id,
      rootId,
      account,
      permissions,
      parentId: optionalParentId,
      revoked: false
    }
    )

    await DelegationService.storeOnChain(newDelegationNode, signatures.invitee)
      .then(() => {
        notifySuccess(
          `${isPCR ? 'PCR member' : 'Delegation'} successfully created`
        )
        blockUi.remove()
        this.replyToInvitee()
      })
      .catch(error => {
        blockUi.remove()
        errorService.log({
          error,
          message: `${isPCR ? 'PCR member' : 'Delegation'} creation failed.`,
          origin: 'CreateDelegation.createDelegation()',
          type: 'ERROR.FETCH.POST',
        })
        notifyError(error)
      })
  }

  private checkSignature(): void {
    const { delegationData, signatures, inviterAddress } = this.props
    const valid = Crypto.verify(
      JSON.stringify(delegationData),
      signatures.inviter,
      inviterAddress
    )
    this.setState({
      isSignatureValid: valid,
    })
  }

  private replyToInvitee(): void {
    const { delegationData, onFinished, inviteeAddress } = this.props

    AttestationWorkflow.informCreateDelegation(
      delegationData.id,
      inviteeAddress,
      delegationData.isPCR
    ).then(() => {
      if (onFinished) {
        onFinished()
      }
    })
  }

  public render(): JSX.Element {
    const { delegationData, inviteeAddress } = this.props
    const { isPCR, permissions } = delegationData
    const { isSignatureValid } = this.state

    let content = null

    if (isSignatureValid == null) {
      content = <Spinner />
    } else if (isSignatureValid) {
      content = (
        <>
          <h2>Create {isPCR ? 'PCR member' : 'delegation'}</h2>

          <div className="delegationData">
            <div>
              <label>Invitee</label>
              <div>
                <ContactPresentation address={inviteeAddress} interactive />
              </div>
            </div>
            <div>
              <label>Invitees permissions</label>
              <div>
                <Permissions permissions={permissions} />
              </div>
            </div>
          </div>

          <DelegationDetailView
            delegationId={delegationData.parentId}
            isPCR={isPCR}
          />

          <div className="actions">
            <button type="button" onClick={this.onCancel}>
              Cancel
            </button>
            <button type="button" onClick={this.createDelegation}>
              Create {isPCR ? 'PCR member' : 'delegation'}
            </button>
          </div>
        </>
      )
    } else {
      content = (
        <>
          <h2 className="danger">Alert!</h2>
          <div className="danger">
            Inviters signature does not match attached data
          </div>
        </>
      )
    }

    return <section className="AcceptDelegation">{content}</section>
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  myDelegations: Delegations.getDelegations(state),
})

export default connect(mapStateToProps)(CreateDelegation)
