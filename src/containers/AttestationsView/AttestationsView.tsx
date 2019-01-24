import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import * as Attestations from '../../state/ducks/Attestations'
import persistentStore from '../../state/PersistentStore'
import './AttestationsView.scss'
import attestationService from '../../services/AttestationService'
import ErrorService from 'src/services/ErrorService'

type AttestationListModel = Attestations.Entry

type Props = RouteComponentProps<{}> & {
  attestations: AttestationListModel[]
}

type State = {}

class AttestationsView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.revokeAttestation = this.revokeAttestation.bind(this)
  }

  public render() {
    const { attestations } = this.props
    console.log('attestations', attestations)
    return (
      <section className="AttestationsView">
        <h1>MANAGE ATTESTATIONS</h1>
        <table>
          <thead>
            <tr>
              <th>Claimer</th>
              <th>CTYPE</th>
              <th>Approved</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {attestations.map((attestation: AttestationListModel) => (
              <tr>
                <td className="ellipsis">
                  <span className="alias">{attestation.claimerAlias}</span>{' '}
                  {attestation.claimerAddress}
                </td>
                <td className="ellipsis">
                  <span className="alias">{attestation.ctypeName}</span>{' '}
                  {attestation.ctypeHash}
                </td>
                <td
                  className={
                    attestation.attestation.revoked ? 'revoked' : 'approved'
                  }
                />
                <td>
                  {!attestation.attestation.revoked ? (
                    <button
                      title="Revoke"
                      className="revoke"
                      onClick={this.revokeAttestation(attestation)}
                    />
                  ) : (
                    ''
                  )}
                  <button
                    title="Delete"
                    className="delete"
                    onClick={this.deleteAttestation(attestation)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    )
  }

  private revokeAttestation = (
    attestationListModel?: AttestationListModel
  ): (() => void) => () => {
    if (attestationListModel) {
      attestationService
        .revoke(attestationListModel.attestation)
        .then(() => {
          console.log('revoked')
        })
        .catch(error => {
          ErrorService.log('attestation.revoke', error)
        })
    }
  }

  private deleteAttestation = (
    attestationListModel?: AttestationListModel
  ): (() => void) => () => {
    if (attestationListModel) {
      console.log('TODO: delete attestation from store')
      // TODO implement delete attestation from store
    }
  }
}

const mapStateToProps = (state: {
  attestations: Attestations.ImmutableState
}) => {
  const selectedIdentity: sdk.Identity = persistentStore.getSelectedIdentity()
  console.log('selectedIdentity', selectedIdentity.address)
  return {
    attestations: state.attestations
      .get('attestations')
      .toList()
      .toArray(),
  }
}

export default connect(mapStateToProps)(withRouter(AttestationsView))
