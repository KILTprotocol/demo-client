import * as sdk from '@kiltprotocol/sdk-js'
import React, { useState, useEffect } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import PersistentStore, {
  State as ReduxState,
} from '../../../state/PersistentStore'
import { notifySuccess } from '../../../services/FeedbackService'
import * as Claims from '../../../state/ducks/Claims'

type StateProps = {
  claims: Claims.Entry[]
}

type DispatchProps = {
  addAttestationToClaim: (attestation: sdk.IAttestedClaim) => void
  removeRequestForAttestation: (
    claimId: Claims.Entry['id'],
    rootHash: sdk.IRequestForAttestation['rootHash']
  ) => void
}

type OwnProps = {
  attestation: sdk.IAttestation
  onCancel?: () => void
  onFinished?: () => void
}

type Props = DispatchProps & OwnProps & StateProps

const ImportAttestation: React.FC<Props> = ({
  claims,
  attestation,
  onCancel,
  onFinished,
  addAttestationToClaim,
  removeRequestForAttestation,
}) => {
  const [requestForAttestation, setRequestForAttestation] = useState<
    sdk.IRequestForAttestation
  >()
  const [claimId, setClaimId] = useState<Claims.Entry['id']>()

  const request = (): void => {
    claims.map(val =>
      val.requestForAttestations.forEach((requestForAttestationEntry): void => {
        if (requestForAttestationEntry.rootHash === attestation.claimHash) {
          setRequestForAttestation(requestForAttestationEntry)
          setClaimId(val.id)
        }
      })
    )
  }

  useEffect(() => {
    if (!requestForAttestation) request()
  })

  const importAttestation = (): void => {
    if (!requestForAttestation) {
      throw new Error('No matching Request')
    } else {
      addAttestationToClaim({ attestation, request: requestForAttestation })
      notifySuccess('Attested claim successfully imported.')
    }

    if (claimId && requestForAttestation) {
      removeRequestForAttestation(claimId, requestForAttestation.rootHash)
    }

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
  claims: Claims.getClaims(state),
})

const mapDispatchToProps: DispatchProps = {
  addAttestationToClaim: (attestation: sdk.IAttestedClaim) =>
    PersistentStore.store.dispatch(Claims.Store.addAttestation(attestation)),
  removeRequestForAttestation: (
    claimId: Claims.Entry['id'],
    rootHash: sdk.IRequestForAttestation['rootHash']
  ) =>
    PersistentStore.store.dispatch(
      Claims.Store.removeRequestForAttestation(claimId, rootHash)
    ),
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportAttestation)
