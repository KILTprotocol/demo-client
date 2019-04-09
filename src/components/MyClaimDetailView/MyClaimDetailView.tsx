import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import AttestedClaimsListView from '../../components/AttestedClaimsListView/AttestedClaimsListView'
import * as Claims from '../../state/ducks/Claims'
import ClaimDetailView from '../ClaimDetailView/ClaimDetailView'

import './MyClaimDetailView.scss'

type Props = {
  cancelable?: boolean
  claimEntry: Claims.Entry
  hideAttestedClaims?: boolean
  onRemoveClaim?: (claimId: Claims.Entry['id']) => void
  onRequestAttestation?: (claimId: Claims.Entry['id']) => void
  onRequestLegitimation?: (claimId: Claims.Entry['id']) => void
}

type State = {
  canResolveAttesters: boolean
}

class MyClaimDetailView extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
    this.requestAttestation = this.requestAttestation.bind(this)
    this.requestLegitimation = this.requestLegitimation.bind(this)
  }

  public render() {
    const { claimEntry, hideAttestedClaims }: Props = this.props

    return claimEntry ? (
      <section className="MyClaimDetailView">
        <h1>
          <span>
            My claim '{claimEntry.meta.alias}'
            <span className="claimId">{claimEntry.id}</span>
          </span>
        </h1>
        <ClaimDetailView claim={claimEntry.claim} />
        {!hideAttestedClaims && (
          <AttestedClaimsListView attestedClaims={claimEntry.attestations} />
        )}
        {this.getActions()}
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }

  private getActions() {
    const {
      cancelable,
      onRemoveClaim,
      onRequestAttestation,
      onRequestLegitimation,
    }: Props = this.props
    return (
      <div className="actions">
        {cancelable && (
          <Link className="cancel" to="/claim">
            Cancel
          </Link>
        )}
        {onRemoveClaim && (
          <button className="deleteClaim" onClick={this.handleDelete} />
        )}
        {onRequestLegitimation && (
          <button
            className="requestLegitimation"
            onClick={this.requestLegitimation}
            title="Request legitimation for attestation of this claim from attester"
          >
            Get Legitimation
          </button>
        )}
        {onRequestAttestation && (
          <button
            className="requestAttestation"
            onClick={this.requestAttestation}
            title="Request attestation of this claim from attester"
          >
            Get Attestation
          </button>
        )}
      </div>
    )
  }

  private handleDelete() {
    const { claimEntry, onRemoveClaim }: Props = this.props
    if (claimEntry && onRemoveClaim) {
      onRemoveClaim(claimEntry.id)
    }
  }

  private requestAttestation() {
    const { claimEntry, onRequestAttestation }: Props = this.props
    if (claimEntry && onRequestAttestation) {
      onRequestAttestation(claimEntry.id)
    }
  }

  private requestLegitimation() {
    const { claimEntry, onRequestLegitimation }: Props = this.props
    if (claimEntry && onRequestLegitimation) {
      onRequestLegitimation(claimEntry.id)
    }
  }
}

export default MyClaimDetailView
