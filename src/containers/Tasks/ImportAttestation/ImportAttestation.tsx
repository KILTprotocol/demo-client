import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect } from 'react-redux'
import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'

import { notifySuccess } from '../../../services/FeedbackService'
import * as Claims from '../../../state/ducks/Claims'

type DispatchProps = {
  addAttestationToClaim: (attestation: sdk.IAttestedClaim) => void
}

type OwnProps = {
  attestedClaim: sdk.IAttestedClaim

  onCancel?: () => void
  onFinished?: () => void
}

type Props = DispatchProps & OwnProps

class ImportAttestation extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.onCancel = this.onCancel.bind(this)
    this.importAttestation = this.importAttestation.bind(this)
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private importAttestation(): void {
    const { addAttestationToClaim, attestedClaim, onFinished } = this.props
    addAttestationToClaim(attestedClaim)
    notifySuccess('Attested claim successfully imported.')
    if (onFinished) {
      onFinished()
    }
  }

  public render(): JSX.Element {
    const { attestedClaim } = this.props
    return (
      <section className="ImportAttestation">
        <ClaimDetailView claim={attestedClaim.request.claim} />

        <AttestedClaimsListView
          attestedClaims={attestedClaim.request.legitimations}
          delegationId={attestedClaim.request.delegationId}
          context="terms"
        />

        <div className="actions">
          <button type="button" onClick={this.onCancel}>
            Cancel
          </button>
          <button type="button" onClick={this.importAttestation}>
            Import Attestation
          </button>
        </div>
      </section>
    )
  }
}

const mapDispatchToProps: DispatchProps = {
  addAttestationToClaim: (attestation: sdk.IAttestedClaim) =>
    Claims.Store.addAttestation(attestation),
}

export default connect(null, mapDispatchToProps)(ImportAttestation)
