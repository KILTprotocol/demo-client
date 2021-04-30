import {
  ICType,
  IRequestClaimsForCTypes,
  MessageBodyType,
} from '@kiltprotocol/types'
import React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import MessageRepository from '../../../services/MessageRepository'
import { IContact } from '../../../types/Contact'

import './RequestClaimsForCType.scss'

export type RequestClaimsForCTypeProps = {
  cTypeHashes: Array<ICType['hash']>
  receiverAddresses: Array<IContact['publicIdentity']['address']>

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

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private sendRequest(): void {
    const { cTypeHashes, receiverAddresses, onFinished } = this.props

    const messageBody: IRequestClaimsForCTypes = {
      content: cTypeHashes.map(cTypeHash => ({ cTypeHash })),
      type: MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES,
    }

    MessageRepository.sendToAddresses(receiverAddresses, messageBody).then(
      () => {
        if (onFinished) {
          onFinished()
        }
      }
    )
  }

  public render(): JSX.Element {
    const { cTypeHashes, receiverAddresses } = this.props

    return (
      <section className="RequestClaimsForCType">
        <div className="actions">
          <button type="button" onClick={this.onCancel}>
            Cancel
          </button>
          <button
            type="button"
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
}

export default RequestClaimsForCType
