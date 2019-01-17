import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import * as Claims from '../../state/ducks/Claims'
import { Attestation } from '../../types/Claim'
import Code from '../Code/Code'

import './ClaimDetailView.scss'

type Props = {
  claim?: Claims.Entry
  onRemoveClaim: (hash: string) => void
  onRequestAttestation: (hash: string) => void
}

type State = {}

class ClaimDetailView extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
    this.requestAttestation = this.requestAttestation.bind(this)
  }

  public render() {
    const { claim, attestations }: Props = this.props.claim

    return claim ? (
      <section className="ClaimDetailView">
        <h1>{claim.alias}</h1>
        {this.getAttributes(claim)}
        {this.getAttestations(attestations)}
        {this.getActions()}
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }

  private getAttributes(claim: Claims.Entry) {
    const verified = claim ? claim.verifySignature() : false
    return (
      <div className="attributes">
        <div>
          <label>Hash</label>
          <div>{claim.hash}</div>
        </div>
        <div>Ctype: {claim.ctype}</div>
        <div>Signature: {claim.signature}</div>
        <div>Owner: {claim.owner}</div>
        <div>Verified: {verified ? 'true' : 'false'}</div>
        <div>
          <label>Contents</label>
          <div>
            <Code>{claim.contents}</Code>
          </div>
        </div>
      </div>
    )
  }

  private getAttestations(attestations: Attestation[]) {
    return (
      <section className="attestations">
        <h3>Attestations</h3>
        {
          !!attestations && !!attestations.length ? (
            <table>
              <thead>
                <tr>
                  <th>Attester</th>
                  <th>Approved</th>
                  <th>Chain Status</th>
                </tr>
              </thead>
              <tbody>
                {attestations.map((attestation: Attestation) => (
                  <tr key={attestation.signature}>
                    <td>{attestation.owner}</td>
                    <td className={attestation.revoked ? 'revoked' : 'approved'} />
                    <td>
                      <button className="refresh" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>No Attestations found.</div>
          )
        }
      </section>
    )
  }

  private getActions() {
    return (
      <div className="actions">
        <Link className="cancel" to="/claim">
          Cancel
        </Link>
        <button
          className="requestAttestation"
          onClick={this.requestAttestation}
        >
          Request Attestation
        </button>
        <button className="deleteClaim" onClick={this.handleDelete}>
          Delete
        </button>
      </div>
    )
  }

  private handleDelete() {
    const { claim, onRemoveClaim }: Props = this.props
    if (claim) {
      onRemoveClaim(claim.hash)
    }
  }

  private requestAttestation() {
    const { claim, onRequestAttestation }: Props = this.props
    if (claim) {
      onRequestAttestation(claim.hash)
    }
  }
}

export default ClaimDetailView
