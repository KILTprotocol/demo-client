import * as sdk from '@kiltprotocol/prototype-sdk'
import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import * as Claims from '../../state/ducks/Claims'
import Code from '../Code/Code'
import './ClaimDetailView.scss'

type Props = {
  claimEntry?: Claims.Entry
  onRemoveClaim: (hash: string) => void
  onRequestAttestation: (hash: string) => void
  onVerifyAttestation: (attesation: sdk.IAttestation) => Promise<boolean>
}

type State = {
  invalidAttestations: string[]
}

class ClaimDetailView extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
    this.requestAttestation = this.requestAttestation.bind(this)
    this.verifyAttestation = this.verifyAttestation.bind(this)

    const { claimEntry } = this.props
    if (claimEntry) {
      this.state = {
        invalidAttestations: claimEntry.attestations.map(
          (attestation: sdk.IAttestation) => {
            return attestation.claimHash
          }
        ),
      }
    }

    setTimeout(() => {
      this.verifyAttestations()
    }, 500)
  }

  public render() {
    const { claimEntry }: Props = this.props

    return claimEntry ? (
      <section className="ClaimDetailView">
        <h1>{claimEntry.claim.alias}</h1>
        {this.getAttributes(claimEntry.claim)}
        {this.getAttestations(claimEntry.attestations)}
        {this.getActions()}
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }

  private getAttributes(claim: sdk.Claim) {
    const verified = claim ? claim.verifySignature() : false
    return (
      <div className="attributes">
        <div>
          <label>Hash</label>
          <div>{claim.hash}</div>
        </div>
        <div>
          <label>Ctype</label>
          <div>{claim.ctype}</div>
        </div>
        <div>
          <label>Signature</label>
          <div>{claim.signature}</div>
        </div>
        <div>
          <label>Owner</label>
          <div>{claim.owner}</div>
        </div>
        <div>
          <label>Verified</label>
          <div>{verified ? 'true' : 'false'}</div>
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

  private getAttestations(attestations: sdk.IAttestation[]) {
    return (
      <section className="attestations">
        <h3>Attestations</h3>
        {!!attestations && !!attestations.length ? (
          <table>
            <thead>
              <tr>
                <th>Attester</th>
                <th>Approved</th>
                <th>Chain Status</th>
              </tr>
            </thead>
            <tbody>
              {attestations.map((attestation: sdk.IAttestation) => (
                <tr key={attestation.signature}>
                  <td>{attestation.owner}</td>
                  <td
                    className={
                      this.isApproved(attestation) ? 'approved' : 'revoked'
                    }
                  />
                  <td>
                    <button
                      className="refresh"
                      onClick={this.verifyAttestation(attestation)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No Attestations found.</div>
        )}
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

  private isApproved(attestation: sdk.IAttestation): boolean {
    const { invalidAttestations } = this.state
    return !invalidAttestations.includes(attestation.claimHash)
  }

  private handleDelete() {
    const { claimEntry, onRemoveClaim }: Props = this.props
    if (claimEntry) {
      onRemoveClaim(claimEntry.claim.hash)
    }
  }

  private requestAttestation() {
    const { claimEntry, onRequestAttestation }: Props = this.props
    if (claimEntry) {
      onRequestAttestation(claimEntry.claim.hash)
    }
  }

  private verifyAttestations(): void {
    const { claimEntry } = this.props

    if (claimEntry) {
      claimEntry.attestations.forEach(attestation => {
        this.verifyAttestation(attestation)()
      })
    }
  }

  private verifyAttestation = (
    attestation: sdk.IAttestation
  ): (() => void) => () => {
    const { onVerifyAttestation } = this.props
    const { invalidAttestations } = this.state
    onVerifyAttestation(attestation).then(verified => {
      if (verified) {
        invalidAttestations.splice(
          invalidAttestations.indexOf(attestation.claimHash),
          1
        )
        this.setState({ invalidAttestations })
      }
    })
  }
}

export default ClaimDetailView
