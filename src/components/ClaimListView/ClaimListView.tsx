import * as React from 'react'
import { Link } from 'react-router-dom'

import * as Claims from '../../state/ducks/Claims'

type Props = {
  claims: Claims.Entry[]
  removeClaim: (id: string) => void
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
        <Link to="/ctype">Create Claim from CTYPE</Link>
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
                    <Link to={`/claim/${claim.id}`}>{claim.alias}</Link>
                  </td>
                  <td>{JSON.stringify(claim.claim.contents)}</td>
                  <td>
                    <button
                      className="deleteClaim"
                      onClick={this.handleDelete(claim.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    )
  }
  private handleDelete = (id: string): (() => void) => () => {
    const { removeClaim } = this.props
    removeClaim(id)
  }
}

export default ClaimListView
