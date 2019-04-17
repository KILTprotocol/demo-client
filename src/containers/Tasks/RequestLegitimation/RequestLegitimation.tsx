import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import attestationWorkflow from '../../../services/AttestationWorkflow'

import './RequestLegitimation.scss'

export type RequestLegitimationsProps = {
  claim: sdk.IPartialClaim
  receiverAddresses: Array<sdk.PublicIdentity['address']>

  onFinished?: () => void
}

type State = {}

class RequestLegitimation extends React.Component<
  RequestLegitimationsProps,
  State
> {
  constructor(props: RequestLegitimationsProps) {
    super(props)
    this.state = {}

    this.handleSubmit = this.handleSubmit.bind(this)
  }

  public render() {
    const { receiverAddresses } = this.props
    return (
      <section className="RequestLegitimation">
        <div className="actions">
          <button
            className="requestLegitimation"
            disabled={!receiverAddresses.length}
            onClick={this.handleSubmit}
          >
            Request Legitimation
          </button>
        </div>
      </section>
    )
  }

  private handleSubmit() {
    const { claim, receiverAddresses, onFinished } = this.props

    attestationWorkflow
      .requestLegitimations(claim, receiverAddresses)
      .then(() => {
        if (onFinished) {
          onFinished()
        }
      })
  }
}

export default RequestLegitimation
