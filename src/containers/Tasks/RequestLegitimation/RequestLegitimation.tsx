import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import SelectClaims from '../../../components/SelectClaims/SelectClaims'

import attestationWorkflow from '../../../services/AttestationWorkflow'
import * as Claims from '../../../state/ducks/Claims'
import { ICType } from '../../../types/Ctype'

import './RequestLegitimation.scss'

export type RequestLegitimationsProps = {
  cTypeHash: ICType['cType']['hash']
  receiverAddresses: Array<sdk.PublicIdentity['address']>
  preSelectedClaimEntries?: Claims.Entry[]

  onFinished?: () => void
  onCancel?: () => void
}

type State = {
  claim?: sdk.IPartialClaim
}

class RequestLegitimation extends React.Component<
  RequestLegitimationsProps,
  State
> {
  constructor(props: RequestLegitimationsProps) {
    super(props)
    this.state = {}

    this.onCancel = this.onCancel.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onSelectClaimEntry = this.onSelectClaimEntry.bind(this)
  }

  public render() {
    const { cTypeHash, preSelectedClaimEntries, receiverAddresses } = this.props
    return (
      <section className="RequestLegitimation">
        <section className="selectClaims">
          <h2 className="optional">Select claim</h2>
          <SelectClaims
            preSelectedClaimEntries={preSelectedClaimEntries}
            cTypeHash={cTypeHash}
            onChange={this.onSelectClaimEntry}
          />
        </section>
        <div className="actions">
          <button onClick={this.onCancel}>Cancel</button>
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

  private onSelectClaimEntry(claimEntries: Claims.Entry[]) {
    const claim =
      claimEntries && claimEntries[0] ? claimEntries[0].claim : undefined
    this.setState({ claim })
  }

  private handleSubmit() {
    const { receiverAddresses, onFinished } = this.props
    const { claim } = this.state

    if (claim && receiverAddresses) {
      attestationWorkflow
        .requestLegitimations(claim, receiverAddresses)
        .then(() => {
          if (onFinished) {
            onFinished()
          }
        })
    }
  }

  private onCancel() {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }
}

export default RequestLegitimation
