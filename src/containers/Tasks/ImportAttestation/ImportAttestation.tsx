import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import { State as ReduxState } from '../../../state/PersistentStore'
import { notifySuccess } from '../../../services/FeedbackService'
import * as Claims from '../../../state/ducks/Claims'

type StateProps = {
  requestForAttestations: Claims.Entry[]
}

type DispatchProps = {
  addAttestationToClaim: (attestation: sdk.IAttestation) => void
}

type OwnProps = {
  attestation: sdk.IAttestation
  requestForAttestationRootHash: sdk.IRequestForAttestation['rootHash']
  onCancel?: () => void
  onFinished?: () => void
}

type Props = DispatchProps & OwnProps & StateProps

type State = {
  requestForAttestation?: sdk.IRequestForAttestation
}

class ImportAttestation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.onCancel = this.onCancel.bind(this)
    this.importAttestation = this.importAttestation.bind(this)
  }

  public componentDidMount(): void {
    const { requestForAttestationRootHash, requestForAttestations } = this.props
    let request
    requestForAttestations.map(val =>
      val.requestForAttestations.map(requestForAttestationEntry => {
        if (
          requestForAttestationEntry.rootHash === requestForAttestationRootHash
        ) {
          request = requestForAttestationEntry
        }
      })
    )
    this.setState({ requestForAttestation: request })
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private importAttestation(): void {
    const { addAttestationToClaim, attestation, onFinished } = this.props
    addAttestationToClaim(attestation)
    notifySuccess('Attested claim successfully imported.')
    if (onFinished) {
      onFinished()
    }
  }

  public render(): JSX.Element {
    const { requestForAttestation } = this.state

    if (requestForAttestation) {
      return (
        requestForAttestation && (
          <section className="ImportAttestation">
            <ClaimDetailView claim={requestForAttestation.claim} />

            <AttestedClaimsListView
              attestedClaims={requestForAttestation.legitimations}
              delegationId={requestForAttestation.delegationId}
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
      )
    }
    return <></>
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  requestForAttestations: Claims.getClaims(state),
})

const mapDispatchToProps: DispatchProps = {
  addAttestationToClaim: (attestation: sdk.IAttestation) =>
    Claims.Store.addAttestation(attestation),
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportAttestation)
