import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'
import ContactPresentation from '../../../components/ContactPresentation/ContactPresentation'
import Spinner from '../../../components/Spinner/Spinner'
import { notifyFailure } from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import * as Wallet from '../../../state/ducks/Wallet'
import { State as ReduxState } from '../../../state/PersistentStore'
import { Contact, MyIdentity } from '../../../types/Contact'

import './AcceptDelegation.scss'
import DelegationsService from 'src/services/DelegationsService'

type Props = {
  delegationData: sdk.IRequestAcceptDelegation['content']['delegationData']
  inviterAddress: Contact['publicIdentity']['address']
  metaData?: sdk.IRequestAcceptDelegation['content']['metaData']
  selectedIdentity: MyIdentity
  signatures: sdk.IRequestAcceptDelegation['content']['signatures']
  onFinished?: () => void
}

type State = {
  isSignatureValid?: boolean
}

class AcceptDelegation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.signAndReply = this.signAndReply.bind(this)
  }

  public componentDidMount() {
    this.checkSignature()
  }

  public render() {
    const { delegationData, inviterAddress, metaData } = this.props
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
            </div>

            <div className="actions">
              <button onClick={this.signAndReply}>Accept Inivitation</button>
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

  private async signAndReply() {
    const {
      delegationData,
      inviterAddress,
      onFinished,
      signatures,
    } = this.props

    const signature = await this.signNewDelegationNode(delegationData)

    const messageBody: sdk.ISubmitAcceptDelegation = {
      content: {
        delegationData,
        signatures: {
          ...signatures,
          invitee: signature,
        },
      },
      type: sdk.MessageBodyType.SUBMIT_ACCEPT_DELEGATION,
    }

    MessageRepository.sendToAddress(inviterAddress, messageBody).then(() => {
      if (onFinished) {
        onFinished()
      }
    })
  }

  private async signNewDelegationNode(
    delegationData: sdk.IRequestAcceptDelegation['content']['delegationData']
  ): Promise<string> {
    const { selectedIdentity } = this.props
    const { account, id, parentId, permissions } = delegationData

    const rootNode:
      | sdk.IDelegationRootNode
      | undefined = await DelegationsService.findRootNode(parentId)
    if (!rootNode) {
      notifyFailure('Cannot sign: unable to find root node')
      throw new Error(`Root node not found for node ${parentId}`)
    }

    const newDelegationNode = new sdk.DelegationNode(
      id,
      rootNode.id,
      account,
      permissions,
      parentId
    )

    return selectedIdentity.identity.signStr(newDelegationNode.generateHash())
  }

  private checkSignature() {
    const { delegationData, signatures, inviterAddress } = this.props
    const valid = sdk.Crypto.verify(
      JSON.stringify(delegationData),
      signatures.inviter,
      inviterAddress
    )
    this.setState({ isSignatureValid: valid })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(AcceptDelegation)
