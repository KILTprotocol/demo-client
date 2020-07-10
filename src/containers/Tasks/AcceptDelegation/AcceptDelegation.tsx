import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import DelegationDetailView from '../../../components/DelegationDetailView/DelegationDetailView'
import Permissions from '../../../components/Permissions/Permissions'
import Spinner from '../../../components/Spinner/Spinner'
import { notifyFailure } from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import * as Wallet from '../../../state/ducks/Wallet'
import { State as ReduxState } from '../../../state/PersistentStore'
import { IContact, IMyIdentity } from '../../../types/Contact'
import DelegationsService from '../../../services/DelegationsService'

import './AcceptDelegation.scss'

type StateProps = {
  selectedIdentity: IMyIdentity
}

type OwnProps = {
  delegationData: sdk.IRequestAcceptDelegation['content']['delegationData']
  inviterAddress: IContact['publicIdentity']['address']
  signatures: sdk.IRequestAcceptDelegation['content']['signatures']

  metaData?: sdk.IRequestAcceptDelegation['content']['metaData']

  onCancel?: () => void
  onFinished?: () => void
}

type Props = StateProps & OwnProps

type State = {
  isSignatureValid?: boolean
}

class AcceptDelegation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.onCancel = this.onCancel.bind(this)
    this.signAndReply = this.signAndReply.bind(this)
  }

  public componentDidMount(): void {
    this.checkSignature()
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private async signAndReply(): Promise<void> {
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

    MessageRepository.sendToAddresses([inviterAddress], messageBody).then(
      () => {
        if (onFinished) {
          onFinished()
        }
      }
    )
  }

  private async signNewDelegationNode(
    delegationData: sdk.IRequestAcceptDelegation['content']['delegationData']
  ): Promise<string> {
    const { selectedIdentity } = this.props
    const { account, id, parentId, permissions } = delegationData

    const rootNode: sdk.IDelegationRootNode | null = await DelegationsService.findRootNode(
      parentId
    )
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

  private checkSignature(): void {
    const { delegationData, signatures, inviterAddress } = this.props
    const valid = sdk.Crypto.verify(
      JSON.stringify(delegationData),
      signatures.inviter,
      inviterAddress
    )
    this.setState({ isSignatureValid: valid })
  }

  public render(): JSX.Element {
    const { delegationData, metaData } = this.props
    const { isPCR, parentId, permissions } = delegationData
    const { isSignatureValid } = this.state

    let contents = null

    if (isSignatureValid == null) {
      contents = <Spinner />
    } else if (isSignatureValid) {
      contents = (
        <>
          <h2>Accept invitation to {isPCR ? 'PCR' : 'Delegation'}?</h2>

          <div className="delegationData">
            <div>
              <label>Your permissions</label>
              <div>
                <Permissions permissions={permissions} />
              </div>
            </div>
          </div>

          <DelegationDetailView
            delegationId={parentId}
            focusedNodeAlias={
              metaData &&
              typeof metaData === 'object' &&
              !Array.isArray(metaData) &&
              metaData.alias
                ? metaData.alias
                : undefined
            }
            isPCR={isPCR}
          />

          <div className="actions">
            <button type="button" onClick={this.onCancel}>
              Cancel
            </button>
            <button type="button" onClick={this.signAndReply}>
              Accept Invitation
            </button>
          </div>
        </>
      )
    } else {
      contents = (
        <>
          <h2 className="danger">Alert!</h2>
          <div className="danger">
            Inviters signature does not match attached data
          </div>
        </>
      )
    }

    return <section className="AcceptDelegation">{contents}</section>
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(AcceptDelegation)
