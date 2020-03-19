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
  onRemoveClaim?: (claimEntry: Claims.Entry) => void
  onRequestAttestation?: (claimEntry: Claims.Entry) => void
  onRequestTerm?: (claimEntry: Claims.Entry) => void
}

type State = {
  canResolveAttesters: boolean
}

class MyClaimDetailView extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
    this.requestAttestation = this.requestAttestation.bind(this)
    this.requestTerm = this.requestTerm.bind(this)
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
      onRequestTerm,
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
        {onRequestTerm && (
          <button
            className="requestTerm"
            onClick={this.requestTerm}
            title="Request term for attestation of this claim from attester"
          >
            Request Term
          </button>
        )}
        {onRequestAttestation && (
          <button
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

  private handleDelete() {
    const { claimEntry, onRemoveClaim }: Props = this.props
    if (claimEntry && onRemoveClaim) {
      onRemoveClaim(claimEntry)
    }
  }

  private requestAttestation() {
    const { claimEntry, onRequestAttestation }: Props = this.props
    if (claimEntry && onRequestAttestation) {
      onRequestAttestation(claimEntry)
    }
  }

  private requestTerm() {
    const { claimEntry, onRequestTerm }: Props = this.props
    if (claimEntry && onRequestTerm) {
      onRequestTerm(claimEntry)
    }
  }
}

export default MyClaimDetailView
