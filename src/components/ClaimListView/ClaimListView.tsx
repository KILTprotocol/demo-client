import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { Link } from 'react-router-dom'

import * as Claims from '../../state/ducks/Claims'

import './ClaimListView.scss'

type Props = {
  claimStore: Claims.Entry[]
  onRemoveClaim: (claimId: Claims.Entry['id']) => void
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
                <th className="alias">Alias</th>
                <th className="content">Content</th>
                <th className="status">Attested?</th>
                <th className="actionsTd" />
              </tr>
            </thead>
            <tbody>
              {claimStore.map(claimEntry => (
                <tr key={claimEntry.id}>
                  <td className="alias">
                    <Link to={`/claim/${claimEntry.id}`}>
                      {claimEntry.meta.alias}
                    </Link>
                  </td>
                  <td className="content">
                    {JSON.stringify(claimEntry.claim.contents)}
                  </td>
                  <td
                    className={
                      'status ' +
                      (claimEntry.attestations.find(
                        (attestedClaim: sdk.IAttestedClaim) =>
                          !attestedClaim.attestation.revoked
                      )
                        ? 'attested'
                        : 'revoked')
                    }
                  />
                  <td className="actionsTd">
                    <div className="actions">
                      <button
                        className="requestAttestation"
                        onClick={this.requestAttestation(claimEntry.id)}
                      >
                        Get Attestation
                      </button>
                      <button
                        className="deleteClaim"
                        onClick={this.handleDelete(claimEntry.id)}
                      />
                    </div>
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
