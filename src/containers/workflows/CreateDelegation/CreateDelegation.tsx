import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'

import ContactPresentation from '../../../components/ContactPresentation/ContactPresentation'
import Spinner from '../../../components/Spinner/Spinner'
import ContactRepository from '../../../services/ContactRepository'
import DelegationService from '../../../services/DelegationsService'
import errorService from '../../../services/ErrorService'
import { notifySuccess, notifyFailure } from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import * as Wallet from '../../../state/ducks/Wallet'
import { State as ReduxState } from '../../../state/PersistentStore'
import { Contact, MyIdentity } from '../../../types/Contact'

import './CreateDelegation.scss'

type Props = {
  delegationData: sdk.ISubmitAcceptDelegation['content']['delegationData']
  inviteeAddress: Contact['publicIdentity']['address']
  inviterAddress: Contact['publicIdentity']['address']
  selectedIdentity: MyIdentity
  signatures: sdk.ISubmitAcceptDelegation['content']['signatures']
  onFinished?: () => void
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
    const { delegationData, inviteeAddress, inviterAddress } = this.props
    const { isSignatureValid } = this.state

    return (
      <section className="AcceptDelegation">
        {isSignatureValid ? (
          <>
            <h2>Accept invitation?</h2>

            <div className="delegationData">
              <div>
                <label>Inviters delegation ID</label>
                <div>{delegationData.parentId}</div>
              </div>
              <div>
                <label>CType</label>
                <div>
                  <i>'not yet implemented'</i>
                </div>
              </div>
              <div>
                <label>Invitees permissions</label>
                <div>
                  {delegationData.permissions.map(
                    (permission: sdk.Permission) => (
                      <div key={permission}>{sdk.Permission[permission]}</div>
                    )
                  )}
                </div>
              </div>
              <div>
                <label>Inviter</label>
                <div>
                  <ContactPresentation address={inviterAddress} />
                </div>
              </div>
              <div>
                <label>Invitee</label>
                <div>
                  <ContactPresentation address={inviteeAddress} />
                </div>
              </div>
            </div>

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

    const rootNode:
      | sdk.IDelegationRootNode
      | undefined = await DelegationService.queryRootNode(parentId)
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
        this.replyToInvitee()
      })
      .catch(error => {
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

    const request: sdk.IInformCreateDelegation = {
      content: delegationData.id,
      type: sdk.MessageBodyType.INFORM_CREATE_DELEGATION,
    }

    ContactRepository.findByAddress(inviteeAddress)
      .then((invitee: Contact) => {
        MessageRepository.send(invitee, request)
          .then(() => {
            notifySuccess('Delegation creation successfully communicated.')
            if (onFinished) {
              onFinished()
            }
          })
          .catch(error => {
            errorService.log({
              error,
              message: `Could not send message ${request.type} to ${
                invitee!.metaData.name
              }`,
              origin: 'CreateDelegation.replyToInvitee()',
              type: 'ERROR.FETCH.POST',
            })
          })
      })
      .catch(error => {
        errorService.log({
          error,
          message: `Could not resolve invitee '${inviteeAddress}'`,
          origin: 'CreateDelegation.replyToInvitee()',
          type: 'ERROR.FETCH.GET',
        })
      })

    if (onFinished) {
      onFinished()
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(CreateDelegation)
