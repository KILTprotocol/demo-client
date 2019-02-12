import * as sdk from '@kiltprotocol/prototype-sdk'
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import AttestedClaimsListView from '../../components/AttestedClaimsListView/AttestedClaimsListView'
import { getClaimActions } from '../../containers/ClaimView/ClaimView'
import * as Claims from '../../state/ducks/Claims'
import Code from '../Code/Code'

import './ClaimDetailView.scss'

type Props = {
  cancelable?: boolean
  claimEntry?: Claims.Entry
  onRemoveClaim?: (claimId: Claims.Entry['id']) => void
  onRequestAttestation?: (claimId: Claims.Entry['id']) => void
  onRequestLegitimation?: (claimId: Claims.Entry['id']) => void
  onVerifyAttestation: (attestation: sdk.IAttestedClaim) => Promise<boolean>
}

type State = {
  canResolveAttesters: boolean
}

class ClaimDetailView extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
    this.requestAttestation = this.requestAttestation.bind(this)
    this.requestLegitimation = this.requestLegitimation.bind(this)
  }

  public render() {
    const { claimEntry, onVerifyAttestation }: Props = this.props

    return claimEntry ? (
      <section className="ClaimDetailView">
        <h1>{claimEntry.meta.alias}</h1>
        {this.getAttributes(claimEntry.claim)}
        <AttestedClaimsListView
          attestedClaims={claimEntry.attestations}
          onVerifyAttestation={onVerifyAttestation}
        />
        {this.getActions()}
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }

  private getAttributes(claim: sdk.IClaim) {
    return (
      <div className="attributes">
        <div>
          <label>Ctype</label>
          <div>{claim.ctype}</div>
        </div>
        <div>
          <label>Owner</label>
          <div>{claim.owner}</div>
        </div>
        <div>
          <label>Contents</label>
          <div>
            <Code>{claim.contents}</Code>
          </div>
        </div>
      </div>
    )
  }

  private getActions() {
    const {
      onRemoveClaim,
      onRequestAttestation,
      onRequestLegitimation,
      cancelable,
    }: Props = this.props
    return (
      <div className="actions">
        {cancelable && (
          <Link className="cancel" to="/claim">
            Cancel
          </Link>
        )}
        {onRemoveClaim && getClaimActions('delete', this.handleDelete)}
        {onRequestLegitimation &&
          getClaimActions('requestLegitimation', this.requestLegitimation)}
        {onRequestAttestation &&
          getClaimActions('requestAttestation', this.requestAttestation)}
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

export default ClaimDetailView
