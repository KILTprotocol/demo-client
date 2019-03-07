import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import AttestedClaimsListView
  from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView
  from '../../../components/ClaimDetailView/ClaimDetailView'

import { notifySuccess } from '../../../services/FeedbackService'
import * as Claims from '../../../state/ducks/Claims'

type Props = {
  addAttestationToClaim: (attestation: sdk.IAttestedClaim) => void
  attestedClaim: sdk.IAttestedClaim
  onFinished?: () => void
}

type State = {}

class ImportAttestation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.importAttestation = this.importAttestation.bind(this)
  }

  public render() {
    const {attestedClaim} = this.props
    return (
      <section className="ImportAttestation">
        <ClaimDetailView claim={attestedClaim.request.claim} />
        <AttestedClaimsListView attestedClaims={attestedClaim.request.legitimations} context="legitimations" />
        <div className="actions">
          <button onClick={this.importAttestation}>Import Attestation</button>
        </div>
      </section>
    )
  }

  private importAttestation() {
    const { addAttestationToClaim, attestedClaim, onFinished } = this.props
    addAttestationToClaim(attestedClaim)
    notifySuccess('Attested claim successfully imported.')
    if (onFinished) {
      onFinished()
    }
  }
}

const mapStateToProps = () => {
  return {}
}

const mapDispatchToProps = (dispatch: (action: Claims.Action) => void) => {
  return {
    addAttestationToClaim: (attestation: sdk.IAttestedClaim) => {
      dispatch(Claims.Store.addAttestation(attestation))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImportAttestation)
