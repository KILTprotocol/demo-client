import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import { notifySuccess } from '../../../services/FeedbackService'
import * as Claims from '../../../state/ducks/Claims'

type Props = {
  attestation: sdk.IAttestation
  addAttestationToClaim: (attestation: sdk.IAttestation) => void
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
    const { addAttestationToClaim, attestation, onFinished } = this.props
    addAttestationToClaim(attestation)
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
    addAttestationToClaim: (attestation: sdk.IAttestation) => {
      dispatch(Claims.Store.addAttestation(attestation))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImportAttestation)
