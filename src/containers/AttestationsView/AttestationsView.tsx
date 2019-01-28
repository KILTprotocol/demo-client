import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { notifyFailure } from 'src/services/FeedbackService'
import attestationService from '../../services/AttestationService'
import * as Attestations from '../../state/ducks/Attestations'
import moment from 'moment'

import './AttestationsView.scss'

type AttestationListModel = Attestations.Entry

type Props = RouteComponentProps<{}> & {
  attestations: AttestationListModel[]
}

type State = {}

class AttestationsView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public render() {
    const { attestations } = this.props
    return (
      <section className="AttestationsView">
        <h1>MANAGE ATTESTATIONS</h1>
        <table>
          <thead>
            <tr>
              <th>Claimer</th>
              <th>Claim Hash</th>
              <th>CTYPE</th>
              <th>Created</th>
              <th>Approved</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {attestations.map((attestation: AttestationListModel) => (
              <tr>
                <td className="claimerAlias">
                  <span className="alias">{attestation.claimerAlias}</span>{' '}
                  {attestation.claimerAddress}
                </td>
                <td className="claimHash">
                  {attestation.attestation.claimHash}
                </td>
                <td className="ctypeName">
                  <span className="alias">{attestation.ctypeName}</span>{' '}
                  {attestation.ctypeHash}
                </td>
                <td>{attestation.created.format('YYYY-MM-DD HH:mm')}</td>
                <td
                  className={
                    attestation.attestation.revoked ? 'revoked' : 'approved'
                  }
                />
                <td className="actions">
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
      notifyFailure('Not yet implemented')
    }
  }

  private deleteAttestation = (
    attestationListModel?: AttestationListModel
  ): (() => void) => () => {
    if (attestationListModel) {
      attestationService.removeFromStore(
        attestationListModel.attestation.claimHash
      )
    }
  }
}

const mapStateToProps = (state: {
  attestations: Attestations.ImmutableState
}) => {
  return {
    attestations: state.attestations
      .get('attestations')
      .sortBy(entry => entry.created)
      .toList()
      .toArray(),
  }
}

export default connect(mapStateToProps)(withRouter(AttestationsView))
