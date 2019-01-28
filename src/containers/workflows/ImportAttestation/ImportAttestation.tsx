import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import { notifySuccess } from '../../../services/FeedbackService'
import * as Claims from '../../../state/ducks/Claims'

type Props = {
  attestation: sdk.IAttestation
  addAttestationToClaim: (
    hash: sdk.IClaim['hash'],
    attestation: sdk.IAttestation
  ) => void
  claim: sdk.IClaim
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
    return (
      <section className="ImportAttestation">
        <div className="actions">
          <button onClick={this.importAttestation}>Import Attestation</button>
        </div>
      </section>
    )
  }

  private importAttestation() {
    const { addAttestationToClaim, attestation, claim, onFinished } = this.props
    addAttestationToClaim(claim.hash, attestation)
    notifySuccess('Attestation successfully imported')
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
    addAttestationToClaim: (
      hash: sdk.IClaim['hash'],
      attestation: sdk.IAttestation
    ) => {
      dispatch(Claims.Store.addAttestation(hash, attestation))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImportAttestation)
