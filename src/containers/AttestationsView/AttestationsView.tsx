import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import AttestationStatus from '../../components/AttestationStatus/AttestationStatus'

import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import CTypePresentation from '../../components/CTypePresentation/CTypePresentation'
import DateTime from '../../components/DateTime/DateTime'
import ShortHash from '../../components/ShortHash/ShortHash'
import AttestationService from '../../services/AttestationService'
import FeedbackService, {
  safeDelete,
  notifyError,
} from '../../services/FeedbackService'
import * as Attestations from '../../state/ducks/Attestations'
import { State as ReduxState } from '../../state/PersistentStore'
import { BlockUi } from '../../types/UserFeedback'

import './AttestationsView.scss'

type AttestationListModel = Attestations.Entry

type Props = RouteComponentProps<{}> & {
  attestations: AttestationListModel[]
}

type State = {
  claimHashToRevoke: sdk.IAttestation['claimHash']
}

class AttestationsView extends React.Component<Props, State> {
  private claimHash: HTMLInputElement | null

  constructor(props: Props) {
    super(props)
    this.state = {
      claimHashToRevoke: '',
    }

    this.setClaimHashToRevoke = this.setClaimHashToRevoke.bind(this)
    this.manuallyRevoke = this.manuallyRevoke.bind(this)
  }

  public render() {
    const { attestations } = this.props
    const { claimHashToRevoke } = this.state
    return (
      <section className="AttestationsView">
        <h1>MANAGE ATTESTATIONS</h1>
        <section className="revokeByHash">
          <h2>Revoke attestation</h2>
          <div>
            <input
              type="text"
              onChange={this.setClaimHashToRevoke}
              placeholder="Insert claim hash"
              value={claimHashToRevoke}
            />
            <button disabled={!claimHashToRevoke} onClick={this.manuallyRevoke}>
              Revoke
            </button>
          </div>
        </section>
        <table>
          <thead>
            <tr>
              <th className="claimerAlias">Claimer</th>
              <th className="claimHash">Claim Hash</th>
              <th className="cType">CTYPE</th>
              <th className="created">Created</th>
              <th className="status">Approved</th>
              <th className="actionsTd" />
            </tr>
          </thead>
          <tbody>
            {attestations.map((attestation: AttestationListModel) => (
              <tr key={attestation.attestation.claimHash}>
                <td className="claimerAlias">
                  <ContactPresentation
                    address={attestation.claimerAddress}
                    interactive={true}
                  />
                </td>
                <td
                  className="claimHash"
                  title={attestation.attestation.claimHash}
                >
                  <ShortHash>{attestation.attestation.claimHash}</ShortHash>
                </td>
                <td className="cType" title={attestation.cTypeHash}>
                  <CTypePresentation
                    cTypeHash={attestation.cTypeHash}
                    interactive={true}
                    linked={true}
                  />
                </td>
                <td className="created">
                  <DateTime timestamp={attestation.created} />
                </td>
                <td className="status">
                  <AttestationStatus attestation={attestation.attestation} />
                </td>
                <td className="actionsTd">
                  <div>
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
    if (attestationListModel) {
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Revoking attestation',
      })
      AttestationService.revokeAttestation(attestationListModel.attestation)
        .then(() => {
          blockUi.remove()
        })
        .catch(error => {
          blockUi.remove()
          notifyError(error)
        })
    }
  }

  private deleteAttestation = (
    attestationListModel?: AttestationListModel
  ): (() => void) => () => {
    if (attestationListModel) {
      safeDelete(
        <span>
          the attestation with the claim hash '
          <ShortHash>{attestationListModel.attestation.claimHash}</ShortHash>'
        </span>,
        () => {
          AttestationService.removeFromStore(
            attestationListModel.attestation.claimHash
          )
        }
      )
    }
  }

  private setClaimHashToRevoke(e: React.ChangeEvent<HTMLInputElement>) {
    const claimHash = e.target.value.trim()

    this.setState({
      claimHashToRevoke: claimHash,
    })
  }

  private async manuallyRevoke() {
    const { claimHashToRevoke } = this.state

    if (claimHashToRevoke) {
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Revoking attestation',
      })
      AttestationService.revokeByClaimHash(claimHashToRevoke)
        .then(() => {
          blockUi.remove()
          this.setState({ claimHashToRevoke: '' })
        })
        .catch(error => {
          blockUi.remove()
          notifyError(error)
        })
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  attestations: Attestations.getAttestations(state),
})

export default connect(mapStateToProps)(withRouter(AttestationsView))
