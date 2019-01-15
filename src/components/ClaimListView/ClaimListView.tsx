import * as React from 'react'
import { Link } from 'react-router-dom'

import * as Claims from '../../state/ducks/Claims'

type Props = {
  claims: Claims.Entry[]
  onRemoveClaim: (hash: string) => void
  onRequestAttestation: (hash: string) => void
}

type State = {}

class ClaimListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
  }

  public render() {
    const { claims } = this.props
    return (
      <section className="ClaimListView">
        <h1>My Claims</h1>
        {claims && !!claims.length && (
          <table>
            <thead>
              <tr>
                <th>Alias</th>
                <th>Contents</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim.alias}>
                  <td>
                    <Link to={`/claim/${claim.hash}`}>{claim.alias}</Link>
                  </td>
                  <td>{JSON.stringify(claim.contents)}</td>
                  <td className="actions">
                    <button
                      className="requestAttestation"
                      onClick={this.requestAttestation(claim.hash)}
                    >
                      Request Attestation
                    </button>
                    <button
                        className="deleteClaim"
                        onClick={this.handleDelete(claim.hash)}
                    >
                    Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="actions">
          <Link to="/ctype">Create Claim from CTYPE</Link>
        </div>
      </section>
    )
  }

  private handleDelete = (hash: string): (() => void) => () => {
    const { onRemoveClaim } = this.props
    onRemoveClaim(hash)
  }

  private requestAttestation = (hash: string): (() => void) => () => {
    const { onRequestAttestation } = this.props
    onRequestAttestation(hash)
  }
}

export default ClaimListView
