import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import Code from '../Code/Code'
import * as Claims from '../../state/ducks/Claims'

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
    const { claim }: Props = this.props

    const verified = claim ? claim.verifySignature() : false

    return claim ? (
      <section className="ClaimDetailView">
        <h1>{claim.alias}</h1>
        <Link to="/claim">Go back</Link>
        <hr />
        <div>Hash: {claim.hash}</div>
        <div>Ctype: {claim.ctype}</div>
        <div>
          Contents: <Code>{claim.contents}</Code>
        </div>
        <div>Signature: {claim.signature}</div>
        <div>Owner: {claim.owner}</div>
        <div>Verified: {verified ? 'true' : 'false'}</div>
        <div className="actions">
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
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
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
