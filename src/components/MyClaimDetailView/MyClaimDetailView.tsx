import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { IAttestedClaim } from '@kiltprotocol/sdk-js'
import AttestedClaimsListView from '../AttestedClaimsListView/AttestedClaimsListView'
import RequestForAttestationListView from '../RequestForAttestationListView/RequestForAttestationListView'

import * as Claims from '../../state/ducks/Claims'
import ClaimDetailView from '../ClaimDetailView/ClaimDetailView'

import './MyClaimDetailView.scss'
import { buildMatchingAttestedClaims } from '../../utils/AttestedClaimUtils/AttestedClaimUtils'

type Props = {
  cancelable?: boolean
  claimEntry: Claims.Entry
  hideAttestedClaims?: boolean
  hideRequestForAttestation?: boolean
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

  private getActions(): JSX.Element {
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
          <button
            type="button"
            className="deleteClaim"
            onClick={this.handleDelete}
          />
        )}
        {onRequestTerm && (
          <button
            type="button"
            className="requestTerm"
            onClick={this.requestTerm}
            title="Request term for attestation of this claim from attester"
          >
            Request Term
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

  private requestTerm(): void {
    const { claimEntry, onRequestTerm }: Props = this.props
    if (claimEntry && onRequestTerm) {
      onRequestTerm(claimEntry)
    }
  }

  public render(): JSX.Element {
    const {
      claimEntry,
      hideAttestedClaims,
      hideRequestForAttestation,
    }: Props = this.props
    const BuiltAttestedClaims: IAttestedClaim[] = buildMatchingAttestedClaims(
      claimEntry
    )
    return BuiltAttestedClaims ? (
      <section className="MyClaimDetailView">
        <h1>
          <span>
            My claim &apos;{claimEntry.meta.alias}&apos;
            <span className="claimId">{claimEntry.id}</span>
          </span>
        </h1>
        <ClaimDetailView claim={claimEntry.claim} />

        {!hideRequestForAttestation && (
          <RequestForAttestationListView claim={claimEntry} />
        )}

        {!hideAttestedClaims && (
          <AttestedClaimsListView attestedClaims={BuiltAttestedClaims} />
        )}

        {this.getActions()}
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }
}

export default MyClaimDetailView
