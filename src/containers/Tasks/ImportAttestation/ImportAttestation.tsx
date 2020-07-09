import * as sdk from '@kiltprotocol/sdk-js'
import React, { useState, useEffect } from 'react'
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

const ImportAttestation: React.FC<Props> = ({
  requestForAttestationRootHash,
  requestForAttestations,
  attestation,
  onCancel,
  onFinished,
  addAttestationToClaim,
}) => {
  const [requestForAttestation, setRequestForAttestation] = useState<
    sdk.IRequestForAttestation
  >()
  // this.onCancel = this.onCancel.bind(this)
  // this.importAttestation = this.importAttestation.bind(this)

  //
  // this.setState({ requestForAttestation: request })

  const request = (): void => {
    console.log(requestForAttestations)
    requestForAttestations.map(val =>
      // eslint-disable-next-line array-callback-return
      val.requestForAttestations.map(requestForAttestationEntry => {
        if (
          requestForAttestationEntry.rootHash === requestForAttestationRootHash
        ) {
          console.log(requestForAttestationEntry)
          setRequestForAttestation(requestForAttestationEntry)
        }
      })
    )
  }

  useEffect(() => {
    if (!requestForAttestation) request()
  })

  const importAttestation = (): void => {
    addAttestationToClaim(attestation)
    notifySuccess('Attested claim successfully imported.')
    if (onFinished) {
      onFinished()
    }
  }

  return (
    <section className="ImportAttestation">
      {requestForAttestation && (
        <ClaimDetailView claim={requestForAttestation.claim} />
      )}

      {requestForAttestation && (
        <AttestedClaimsListView
          attestedClaims={requestForAttestation.legitimations}
          delegationId={requestForAttestation.delegationId}
          context="terms"
        />
      )}

      <div className="actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" onClick={importAttestation}>
          Import Attestation
        </button>
      </div>
    </section>
  )
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
