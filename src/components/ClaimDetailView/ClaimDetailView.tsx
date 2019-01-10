import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import * as Claims from '../../state/ducks/Claims'

type Props = {
  claim?: Claims.Entry
  onRemoveClaim: (id: string) => void
  onRequestAttestation: (id: string) => void
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
    return claim ? (
      <section className="ClaimDetailView">
        <h1>{claim.alias}</h1>
        <Link to="/claim">Go back</Link>
        <hr />
        <div>Id: {claim.id}</div>
        <div>Contents: {JSON.stringify(claim.claim.contents)}</div>
        <div className="actions">
          <button className="deleteClaim" onClick={this.handleDelete}>
            Delete
          </button>
          <button
            className="requestAttestation"
            onClick={this.requestAttestation}
          >
            Request Attestation
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
      onRemoveClaim(claim.id)
    }
  }

  private requestAttestation() {
    const { claim, onRequestAttestation }: Props = this.props
    if (claim) {
      onRequestAttestation(claim.id)
    }
  }
}

export default ClaimDetailView
