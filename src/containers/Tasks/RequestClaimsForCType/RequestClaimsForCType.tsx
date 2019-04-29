import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import AttestationWorkflow from '../../../services/AttestationWorkflow'
import MessageRepository from '../../../services/MessageRepository'
import { Contact } from '../../../types/Contact'

import './RequestClaimsForCType.scss'

export type RequestClaimsForCTypeProps = {
  cTypeHash: sdk.ICType['hash']
  receiverAddresses: Array<Contact['publicIdentity']['address']>

  onFinished?: () => void
}

type Props = RequestClaimsForCTypeProps

type State = {}

class RequestClaimsForCType extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.sendRequest = this.sendRequest.bind(this)
  }

  public render() {
    const { cTypeHash, receiverAddresses } = this.props

    return (
      <section className="RequestClaimsForCType">
        <div className="actions">
          <button
            disabled={
              !cTypeHash || !receiverAddresses || !receiverAddresses.length
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
    const { cTypeHash, receiverAddresses, onFinished } = this.props

    const messageBody: sdk.IRequestClaimsForCtype = {
      content: cTypeHash,
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
}

export default RequestClaimsForCType
