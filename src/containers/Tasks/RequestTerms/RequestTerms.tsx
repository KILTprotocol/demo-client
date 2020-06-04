import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import SelectClaims from '../../../components/SelectClaims/SelectClaims'

import attestationWorkflow from '../../../services/AttestationWorkflow'
import * as Claims from '../../../state/ducks/Claims'
import { ICType } from '../../../types/Ctype'

import './RequestTerms.scss'
import { notifyFailure } from '../../../services/FeedbackService'

export type RequestTermsProps = {
  cTypeHash?: ICType['cType']['hash']
  receiverAddresses: Array<sdk.PublicIdentity['address']>
  preSelectedClaimEntries?: Claims.Entry[]
  onFinished?: () => void
  onCancel?: () => void
}

type State = {
  selectedClaimEntries?: Claims.Entry[]
}

class RequestTerms extends React.Component<RequestTermsProps, State> {
  constructor(props: RequestTermsProps) {
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

  private handleSubmit(): void {
    const { cTypeHash, receiverAddresses, onFinished } = this.props
    const { selectedClaimEntries } = this.state

    if (cTypeHash) {
      let claims: sdk.IPartialClaim[] = [{ cTypeHash }]

      if (selectedClaimEntries && selectedClaimEntries.length) {
        claims = selectedClaimEntries.map(
          (claimEntry: Claims.Entry) => claimEntry.claim
        )
      } else {
        notifyFailure(
          `Cannot resolve due to Corresponding CType Hash: ${cTypeHash} not matching`
        )
      }

      if (this.isValid()) {
        attestationWorkflow.requestTerms(claims, receiverAddresses).then(() => {
          if (onFinished) {
            onFinished()
          }
        })
      }
    }
  }

  private isValid(): boolean {
    const { receiverAddresses } = this.props
    return !!(receiverAddresses && receiverAddresses.length)
  }

  public render(): JSX.Element {
    const { cTypeHash, preSelectedClaimEntries, receiverAddresses } = this.props

    return (
      <section className="RequestTerms">
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
            className="requestTerms"
            type="button"
            disabled={!receiverAddresses.length}
            onClick={this.handleSubmit}
          >
            Request Terms
          </button>
        </div>
      </section>
    )
  }
}

export default RequestTerms
