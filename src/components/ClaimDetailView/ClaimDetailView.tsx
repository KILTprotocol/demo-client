import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import * as Claims from '../../state/ducks/Claims'

type Props = {
  claim?: Claims.Entry
  removeClaim: (id: string) => void
}

type State = {}

class ClaimDetailView extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
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
          <button type="delete" onClick={this.handleDelete}>
            Delete
          </button>
        </div>
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }

  private handleDelete() {
    const { claim, removeClaim }: Props = this.props
    if (claim) {
      removeClaim(claim.id)
    }
  }
}

export default ClaimDetailView
