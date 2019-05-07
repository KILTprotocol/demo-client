import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import SelectClaims from '../../../components/SelectClaims/SelectClaims'

import attestationWorkflow from '../../../services/AttestationWorkflow'
import * as Claims from '../../../state/ducks/Claims'
import { ICType } from '../../../types/Ctype'

import './RequestLegitimation.scss'

export type RequestLegitimationsProps = {
  cTypeHash?: ICType['cType']['hash']
  receiverAddresses: Array<sdk.PublicIdentity['address']>
  preSelectedClaimEntries?: Claims.Entry[]

  onFinished?: () => void
  onCancel?: () => void
}

type State = {
  selectedClaimEntries?: Claims.Entry[]
}

class RequestLegitimation extends React.Component<
  RequestLegitimationsProps,
  State
> {
  constructor(props: RequestLegitimationsProps) {
    super(props)
    this.state = {
      selectedClaimEntries: props.preSelectedClaimEntries,
    }

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

  private onSelectClaimEntry(selectedClaimEntries: Claims.Entry[]) {
    this.setState({ selectedClaimEntries })
  }

  private handleSubmit() {
    const { cTypeHash, receiverAddresses, onFinished } = this.props
    const { selectedClaimEntries } = this.state
    let claims: sdk.IPartialClaim[] = [
      { cType: cTypeHash } as sdk.IPartialClaim,
    ]

    if (selectedClaimEntries && selectedClaimEntries.length) {
      claims = selectedClaimEntries.map(
        (claimEntry: Claims.Entry) => claimEntry.claim
      )
    }

    if (this.isValid()) {
      attestationWorkflow
        .requestLegitimations(claims, receiverAddresses)
        .then(() => {
          if (onFinished) {
            onFinished()
          }
        })
    }
  }

  private isValid() {
    const { receiverAddresses } = this.props
    return receiverAddresses && receiverAddresses.length
  }

  private onCancel() {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }
}

export default RequestLegitimation
