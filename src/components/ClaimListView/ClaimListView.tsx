import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { getClaimActions } from '../../containers/ClaimView/ClaimView'

import * as Claims from '../../state/ducks/Claims'

import './ClaimListView.scss'

type Props = {
  claimStore: Claims.Entry[]
  onRemoveClaim: (claimId: Claims.Entry['id']) => void
  onRequestAttestation: (claimId: Claims.Entry['id']) => void
  onRequestLegitimation: (claimId: Claims.Entry['id']) => void
}

type State = {}

class ClaimListView extends React.Component<Props, State> {
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
                      {getClaimActions(
                        'requestLegitimation',
                        this.requestLegitimation.bind(this, claimEntry.id)
                      )}
                      {getClaimActions(
                        'requestAttestation',
                        this.requestAttestation.bind(this, claimEntry.id)
                      )}
                      {getClaimActions(
                        'delete',
                        this.handleDelete.bind(this, claimEntry.id)
                      )}
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

  private handleDelete(claimId: Claims.Entry['id']) {
    const { onRemoveClaim } = this.props
    onRemoveClaim(claimId)
  }

  private requestAttestation(claimId: Claims.Entry['id']) {
    const { onRequestAttestation } = this.props
    onRequestAttestation(claimId)
  }

  private requestLegitimation(claimId: Claims.Entry['id']) {
    const { onRequestLegitimation } = this.props
    onRequestLegitimation(claimId)
  }
}

export default ClaimListView
