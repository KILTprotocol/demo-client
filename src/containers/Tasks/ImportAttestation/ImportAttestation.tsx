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
  addAttestedClaimToClaim: (attestedClaim: sdk.IAttestedClaim) => void
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
  addAttestedClaimToClaim,
  removeRequestForAttestation,
}) => {
  const [requestForAttestationEntry, setRequestForAttestation] = useState<
    sdk.IRequestForAttestation
  >()
  const [claimId, setClaimId] = useState<Claims.Entry['id']>()

  useEffect(() => {
    claims.forEach(claim => {
      let newRequestForAttestation
      let newClaimId
      claim.requestForAttestations.forEach(
        ({ requestForAttestation }): void => {
          if (requestForAttestation.rootHash === attestation.claimHash) {
            newRequestForAttestation = requestForAttestation
            newClaimId = claim.id
          }
        }
      )

      if (!newRequestForAttestation) {
        claim.attestedClaims.forEach(({ request }) => {
          if (request.rootHash === attestation.claimHash) {
            newRequestForAttestation = request
            newClaimId = claim.id
          }
        })
      }

      setRequestForAttestation(newRequestForAttestation)
      setClaimId(newClaimId)
    })
  }, [claims, attestation])

  const importAttestation = (): void => {
    if (!requestForAttestationEntry) {
      throw new Error('No matching Request')
    } else {
      addAttestedClaimToClaim({
        attestation,
        request: requestForAttestationEntry,
      })
      notifySuccess('Attested claim successfully imported.')
    }

    if (claimId && requestForAttestationEntry) {
      removeRequestForAttestation(claimId, requestForAttestationEntry.rootHash)
    }

    if (onFinished) {
      onFinished()
    }
  }

  return (
    <section className="ImportAttestation">
      {requestForAttestationEntry && (
        <>
          <ClaimDetailView claim={requestForAttestationEntry.claim} />
          <AttestedClaimsListView
            attestedClaims={requestForAttestationEntry.legitimations}
            delegationId={requestForAttestationEntry.delegationId}
            context="terms"
          />
        </>
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
  addAttestedClaimToClaim: (attestedClaim: sdk.IAttestedClaim) =>
    PersistentStore.store.dispatch(
      Claims.Store.addAttestedClaim(attestedClaim)
    ),
  removeRequestForAttestation: (
    claimId: Claims.Entry['id'],
    rootHash: sdk.IRequestForAttestation['rootHash']
  ) =>
    PersistentStore.store.dispatch(
      Claims.Store.removeRequestForAttestation(claimId, rootHash)
    ),
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportAttestation)
