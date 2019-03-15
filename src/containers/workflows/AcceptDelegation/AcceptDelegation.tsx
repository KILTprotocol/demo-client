import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'
import ContactPresentation from '../../../components/ContactPresentation/ContactPresentation'
import Spinner from '../../../components/Spinner/Spinner'
import ContactRepository from '../../../services/ContactRepository'
import errorService from '../../../services/ErrorService'
import { notifySuccess } from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import * as Wallet from '../../../state/ducks/Wallet'
import { State as ReduxState } from '../../../state/PersistentStore'
import { Contact, MyIdentity } from '../../../types/Contact'

import './AcceptDelegation.scss'

type Props = {
  delegationData: sdk.IRequestAcceptDelegation['content']['delegationData']
  inviterAddress: Contact['publicIdentity']['address']
  metaData?: sdk.IRequestAcceptDelegation['content']['metaData']
  selectedIdentity: MyIdentity
  signatures: sdk.IRequestAcceptDelegation['content']['signatures']
  onFinished?: () => void
}

type State = {
  isInvitersSignatureValid?: boolean
}

class AcceptDelegation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.signAndReply = this.signAndReply.bind(this)
  }

  public componentDidMount() {
    // TODO: check inviters signature?
    this.checkInvitersSignature()
  }

  public render() {
    const { delegationData, inviterAddress, metaData } = this.props
    const { isInvitersSignatureValid } = this.state

    return (
      <section className="AcceptDelegation">
        {!isInvitersSignatureValid ? (
          <>
            <h2>Accept invitation?</h2>

            <div className="delegationData">
              <div>
                <label>Inviters delegation ID</label>
                <div>{delegationData.parentId}</div>
              </div>
              {metaData && metaData.alias && (
                <div>
                  <label>Alias</label>
                  <div>{metaData.alias}</div>
                </div>
              )}
              <div>
                <label>CType</label>
                <div>
                  <i>'not yet implemented'</i>
                </div>
              </div>
              <div>
                <label>Your permissions</label>
                <div>
                  {delegationData.permissions.map(
                    (permission: sdk.Permission) => (
                      <div key={permission}>{permission}</div>
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
            </div>

            <div className="actions">
              <button onClick={this.signAndReply}>Accept Inivitation</button>
            </div>
          </>
        ) : isInvitersSignatureValid == null ? (
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

  private signAndReply() {
    const {
      delegationData,
      inviterAddress,
      onFinished,
      signatures,
    } = this.props

    const request: sdk.ISubmitAcceptDelegation = {
      content: {
        delegationData,
        signatures: {
          ...signatures,
          invitee: this.signNewDelegationNode(delegationData),
        },
      },
      type: sdk.MessageBodyType.SUBMIT_ACCEPT_DELEGATION,
    }

    ContactRepository.findByAddress(inviterAddress)
      .then((inviter: Contact) => {
        MessageRepository.send(inviter, request)
          .then(() => {
            notifySuccess('Delegation invitation acceptance successfully sent.')
            if (onFinished) {
              onFinished()
            }
          })
          .catch(error => {
            errorService.log({
              error,
              message: `Could not send message ${request.type} to ${
                inviter!.metaData.name
              }`,
              origin: 'AcceptDelegation.signAndReply()',
              type: 'ERROR.FETCH.POST',
            })
          })
      })
      .catch(error => {
        errorService.log({
          error,
          message: `Could not resolve inviter '${inviterAddress}'`,
          origin: 'AcceptDelegation.signAndReply()',
          type: 'ERROR.FETCH.GET',
        })
      })
  }

  private signNewDelegationNode(
    delegationData: sdk.IRequestAcceptDelegation['content']['delegationData']
  ): string {
    const { selectedIdentity } = this.props
    const { account, id, parentId, permissions } = delegationData

    // TODO: replace with getRoot method on parent delegation node
    const rootId = parentId

    const newDelegationNode = new sdk.DelegationNode(
      id,
      rootId,
      account,
      permissions,
      parentId
    )

    return selectedIdentity.identity.signStr(newDelegationNode.generateHash())
  }

  private checkInvitersSignature() {
    this.setState({ isInvitersSignatureValid: true })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(AcceptDelegation)
