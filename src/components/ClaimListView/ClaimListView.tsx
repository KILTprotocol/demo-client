import * as React from 'react'
import { Link } from 'react-router-dom'
import * as sdk from '@kiltprotocol/prototype-sdk'

import * as Claims from '../../state/ducks/Claims'

import './ClaimListView.scss'

type Props = {
  claimStore: Claims.Entry[]
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
    const { claimStore } = this.props

    return (
      <section className="ClaimListView">
        <h1>My Claims</h1>
        {claimStore && !!claimStore.length && (
          <table>
            <thead>
              <tr>
                <th>Alias</th>
                <th>Contents</th>
                <th>Attested?</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {claimStore.map(claimEntry => (
                <tr key={claimEntry.claim.hash}>
                  <td>
                    <Link to={`/claim/${claimEntry.claim.hash}`}>
                      {claimEntry.claim.alias}
                    </Link>
                  </td>
                  <td>{JSON.stringify(claimEntry.claim.contents)}</td>
                  <td
                    className={
                      'attested ' +
                      (claimEntry.attestations.find(
                        (attestation: sdk.Attestation) => !attestation.revoked
                      )
                        ? 'true'
                        : 'false')
                    }
                  />
                  <td className="actions">
                    <button
                      className="requestAttestation"
                      onClick={this.requestAttestation(claimEntry.claim.hash)}
                    >
                      Request Attestation
                    </button>
                    <button
                      className="deleteClaim"
                      onClick={this.handleDelete(claimEntry.claim.hash)}
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
