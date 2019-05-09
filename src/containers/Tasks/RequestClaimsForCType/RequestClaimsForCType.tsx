import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import MessageRepository from '../../../services/MessageRepository'
import { Contact } from '../../../types/Contact'

import './RequestClaimsForCType.scss'

export type RequestClaimsForCTypeProps = {
  cTypeHashes: Array<sdk.ICType['hash']>
  receiverAddresses: Array<Contact['publicIdentity']['address']>

  onFinished?: () => void
  onCancel?: () => void
}

type Props = RequestClaimsForCTypeProps

type State = {}

class RequestClaimsForCType extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.sendRequest = this.sendRequest.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  public render() {
    const { cTypeHashes, receiverAddresses } = this.props

    return (
      <section className="RequestClaimsForCType">
        <div className="actions">
          <button onClick={this.onCancel}>Cancel</button>
          <button
            disabled={
              !cTypeHashes ||
              !cTypeHashes.length ||
              !receiverAddresses ||
              !receiverAddresses.length
            }
            onClick={this.sendRequest}
          >
            Request claims
          </button>
        </div>
      </section>
    )
  }

  private sendRequest() {
    const { cTypeHashes, receiverAddresses, onFinished } = this.props

    const messageBody: sdk.IRequestClaimsForCtype = {
      content: cTypeHashes,
      type: sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPE,
    }

    MessageRepository.sendToAddresses(receiverAddresses, messageBody).then(
      () => {
        if (onFinished) {
          onFinished()
        }
      }
    )
  }

  private onCancel() {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }
}

export default RequestClaimsForCType
