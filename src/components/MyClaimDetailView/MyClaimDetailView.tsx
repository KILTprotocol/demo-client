import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import AttestedClaimsListView from '../AttestedClaimsListView/AttestedClaimsListView'
import * as Claims from '../../state/ducks/Claims'
import ClaimDetailView from '../ClaimDetailView/ClaimDetailView'

import './MyClaimDetailView.scss'

type Props = {
  cancelable?: boolean
  claimEntry: Claims.Entry
  hideAttestedClaims?: boolean
  onRemoveClaim?: (claimEntry: Claims.Entry) => void
  onRequestAttestation?: (claimEntry: Claims.Entry) => void
  onRequestLegitimation?: (claimEntry: Claims.Entry) => void
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

  private getActions(): JSX.Element {
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
          <button
            type="button"
            className="deleteClaim"
            onClick={this.handleDelete}
          />
        )}
        {onRequestLegitimation && (
          <button
            type="button"
            className="requestLegitimation"
            onClick={this.requestLegitimation}
            title="Request legitimation for attestation of this claim from attester"
          >
            Request Legitimation
          </button>
        )}
        {onRequestAttestation && (
          <button
            type="button"
            className="requestAttestation"
            onClick={this.requestAttestation}
            title="Request attestation of this claim from attester"
          >
            Request Attestation
          </button>
        )}
      </div>
    )
  }

  private handleDelete(): void {
    const { claimEntry, onRemoveClaim }: Props = this.props
    if (claimEntry && onRemoveClaim) {
      onRemoveClaim(claimEntry)
    }
  }

  private requestAttestation(): void {
    const { claimEntry, onRequestAttestation }: Props = this.props
    if (claimEntry && onRequestAttestation) {
      onRequestAttestation(claimEntry)
    }
  }

  private requestLegitimation(): void {
    const { claimEntry, onRequestLegitimation }: Props = this.props
    if (claimEntry && onRequestLegitimation) {
      onRequestLegitimation(claimEntry)
    }
  }

  public render(): JSX.Element {
    const { claimEntry, hideAttestedClaims }: Props = this.props

    return claimEntry ? (
      <section className="MyClaimDetailView">
        <h1>
          <span>
            My claim &apos;{claimEntry.meta.alias}&apos;
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
}

export default MyClaimDetailView
