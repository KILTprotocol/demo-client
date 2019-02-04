import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'

import KiltIdenticon from '../../components/KiltIdenticon/KiltIdenticon'
import attestationService from '../../services/AttestationService'
import ContactRepository from '../../services/ContactRepository'
import * as Attestations from '../../state/ducks/Attestations'
import { State as ReduxState } from '../../state/PersistentStore'

import './AttestationsView.scss'
import { BlockUi } from 'src/types/UserFeedback'
import FeedbackService from 'src/services/FeedbackService'

type AttestationListModel = Attestations.Entry

type Props = RouteComponentProps<{}> & {
  attestations: AttestationListModel[]
}

type State = {
  contactsLoaded?: boolean
}

class AttestationsView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    ContactRepository.findAll().then(() => {
      this.setState({ contactsLoaded: true })
    })
  }

  public render() {
    const { attestations } = this.props
    const { contactsLoaded } = this.state
    return (
      <section className="AttestationsView">
        <h1>MANAGE ATTESTATIONS</h1>
        <table>
          <thead>
            <tr>
              <th className="claimerAlias">Claimer</th>
              <th className="claimHash">Claim Hash</th>
              <th className="ctypeName">CTYPE</th>
              <th className="created">Created</th>
              <th className="status">Approved</th>
              <th className="actionsTd" />
            </tr>
          </thead>
          <tbody>
            {attestations.map((attestation: AttestationListModel) => (
              <tr key={attestation.attestation.signature}>
                <td className="claimerAlias">
                  {contactsLoaded ? (
                    <KiltIdenticon
                      contact={ContactRepository.findByAddress(
                        attestation.claimerAddress
                      )}
                      size={24}
                    />
                  ) : (
                    attestation.claimerAlias
                  )}
                </td>
                <td
                  className="claimHash"
                  title={attestation.attestation.claimHash}
                >
                  {attestation.attestation.claimHash}
                </td>
                <td className="ctypeName" title={attestation.ctypeHash}>
                  {attestation.ctypeName}
                </td>
                <td
                  className="created"
                  title={attestation.created.format('YYYY-MM-DD HH:mm')}
                >
                  {attestation.created.format('YY-MM-DD')}
                </td>
                <td
                  className={
                    'status ' +
                    (attestation.attestation.revoked ? 'revoked' : 'attested')
                  }
                />
                <td className="actionsTd">
                  <div className="actions">
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
                  </div>
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
    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Revoking attestation',
    })
    if (attestationListModel) {
      attestationService
        .revokeAttestation(attestationListModel.attestation)
        .then(attestation => {
          blockUi.remove()
        })
        .catch(error => {
          blockUi.remove()
        })
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

const mapStateToProps = (state: ReduxState) => ({
  attestations: Attestations.getAttestations(state),
})

export default connect(mapStateToProps)(withRouter(AttestationsView))
