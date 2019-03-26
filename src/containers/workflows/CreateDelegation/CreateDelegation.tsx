import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'

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
} from '../../../services/FeedbackService'
import { MyDelegation } from '../../../state/ducks/Delegations'
import * as Delegations from '../../../state/ducks/Delegations'
import { State as ReduxState } from '../../../state/PersistentStore'
import { Contact } from '../../../types/Contact'
import { BlockUi } from '../../../types/UserFeedback'

import './CreateDelegation.scss'

type Props = {
  delegationData: sdk.ISubmitAcceptDelegation['content']['delegationData']
  inviteeAddress: Contact['publicIdentity']['address']
  inviterAddress: Contact['publicIdentity']['address']
  signatures: sdk.ISubmitAcceptDelegation['content']['signatures']

  onFinished?: () => void

  // redux
  myDelegations: MyDelegation[]
}

type State = {
  isSignatureValid?: boolean
}

class CreateDelegation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.createDelegation = this.createDelegation.bind(this)
  }

  public componentDidMount() {
    // TODO: check inviters signature?
    this.checkSignature()
  }

  public render() {
    const { delegationData, inviteeAddress } = this.props
    const { isSignatureValid } = this.state

    return (
      <section className="AcceptDelegation">
        {isSignatureValid ? (
          <>
            <h2>Create delegation</h2>

            <div className="delegationData">
              <div>
                <label>Invitee</label>
                <div>
                  <ContactPresentation address={inviteeAddress} />
                </div>
              </div>
              <div>
                <label>Invitees permissions</label>
                <div>
                  <Permissions permissions={delegationData.permissions} />
                </div>
              </div>
            </div>

            <DelegationDetailView id={delegationData.parentId} />

            <div className="actions">
              <button onClick={this.createDelegation}>Create delegation</button>
            </div>
          </>
        ) : isSignatureValid == null ? (
          <Spinner />
        ) : (
          <>
            <h2 className="danger">Alert!</h2>
            <div className="danger">
              Inviters signature does not match attached delegationData
            </div>
          </>
        )}
      </section>
    )
  }

  private async createDelegation() {
    const { delegationData, signatures } = this.props
    const { account, id, parentId, permissions } = delegationData

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Creating delegation...',
    })

    const rootNode:
      | sdk.IDelegationRootNode
      | undefined = await DelegationService.findRootNode(parentId)
    if (!rootNode) {
      notifyFailure('Root delegation not found')
      return
    }
    const rootId = rootNode.id
    let optionalParentId: sdk.IDelegationNode['parentId']
    if (rootId !== parentId) {
      optionalParentId = parentId
    }

    const newDelegationNode = new sdk.DelegationNode(
      id,
      rootId,
      account,
      permissions,
      optionalParentId
    )

    DelegationService.storeOnChain(newDelegationNode, signatures.invitee)
      .then(() => {
        notifySuccess('Delegation successfully created')
        blockUi.remove()
        this.replyToInvitee()
      })
      .catch(error => {
        blockUi.remove()
        errorService.logWithNotification({
          error,
          message: `Delegation creation failed.`,
          origin: 'CreateDelegation.createDelegation()',
          type: 'ERROR.FETCH.POST',
        })
      })
  }

  private checkSignature() {
    const { delegationData, signatures, inviterAddress } = this.props
    const valid = sdk.Crypto.verify(
      JSON.stringify(delegationData),
      signatures.inviter,
      inviterAddress
    )
    this.setState({
      isSignatureValid: valid,
    })
  }

  private replyToInvitee() {
    const { delegationData, onFinished, inviteeAddress } = this.props

    AttestationWorkflow.informCreateDelegation(
      delegationData.id,
      inviteeAddress
    ).then(() => {
      if (onFinished) {
        onFinished()
      }
    })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  myDelegations: Delegations.getDelegations(state),
})

export default connect(mapStateToProps)(CreateDelegation)
