import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import * as Attestations from '../../state/ducks/Attestations'
import persistentStore from '../../state/PersistentStore'
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
    console.log('attestations', attestations)
    return (
      <section className="AttestationsView">
        <h1>MANAGE ATTESTATIONS</h1>
        <table>
          <thead>
            <tr>
              <th>Claimer Alias</th>
              <th>Claimer Address</th>
              <th>CTYPE</th>
              <th>Approved</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {attestations.map((attestation: AttestationListModel) => (
              <tr>
                <td>{attestation.claimerAlias}</td>
                <td className="claimerAddress">{attestation.claimerAddress}</td>
                <td className="ctypeHash">{attestation.ctypeHash}</td>
                <td
                  className={
                    attestation.attestation.revoked ? 'revoked' : 'approved'
                  }
                />
                <td>
                  {!attestation.attestation.revoked ? (
                    <button className="revoke" />
                  ) : (
                    ''
                  )}
                  <button className="delete" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    )
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
