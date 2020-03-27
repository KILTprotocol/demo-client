import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
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

  private onSelectClaimEntry(selectedClaimEntries: Claims.Entry[]): void {
    this.setState({ selectedClaimEntries })
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private isValid(): number {
    const { receiverAddresses } = this.props
    return receiverAddresses && receiverAddresses.length
  }

  private handleSubmit(): void {
    const { cTypeHash, receiverAddresses, onFinished } = this.props
    const { selectedClaimEntries } = this.state
    let claims: sdk.IPartialClaim[] = cTypeHash ? [{ cTypeHash }] : []

    if (selectedClaimEntries && selectedClaimEntries.length) {
      claims = selectedClaimEntries.map(claimEntry => claimEntry.claim)
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

  public render(): JSX.Element {
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
          <button type="button" onClick={this.onCancel}>
            Cancel
          </button>
          <button
            type="button"
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
}

export default RequestLegitimation
