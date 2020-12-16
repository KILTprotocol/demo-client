import { IRequestForAttestation } from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect } from 'react-redux'
import PersistentStore from '../../state/PersistentStore'
import * as Claims from '../../state/ducks/Claims'
import './RequestForAttestationListView.scss'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

interface IPossibleLabels {
  emptyList: string
  h2Multi: string
  h2Single: string
}

const LABELS: IPossibleLabels = {
  emptyList: 'No request for attestation found.',
  h2Multi: 'Request For Attestations',
  h2Single: 'Request For Attestation',
}

type OwnProps = { claim: Claims.Entry }

type DispatchProps = {
  removeRequestForAttestation: (
    claimId: Claims.Entry['id'],
    rootHash: IRequestForAttestation['rootHash']
  ) => void
}

type Props = DispatchProps & OwnProps

const RequestForAttestationListView: React.FunctionComponent<Props> = ({
  claim,
  removeRequestForAttestation,
}) => {
  const { requestForAttestations } = claim
  return (
    <section className="RequestForAttestationListView">
      <h2> {LABELS.h2Single}</h2>
      <table className="opened">
        <thead>
          <tr>
            <th className="attester">Attester</th>
            <th className="claimHash">Root Hash</th>
            <th className="status">Replied</th>
            <th />
          </tr>
        </thead>

        {requestForAttestations &&
          requestForAttestations.map(val => {
            const { requestForAttestation, attesterAddress } = val
            return (
              <tbody key={requestForAttestation.rootHash}>
                <tr className="opened">
                  <td className="attester">
                    <ContactPresentation
                      address={attesterAddress}
                      interactive
                    />
                  </td>
                  <td className="claimHash">
                    {requestForAttestation.rootHash}
                  </td>
                  <td className="replied" />
                  <td
                    className="delete"
                    onClick={() =>
                      removeRequestForAttestation(
                        claim.id,
                        requestForAttestation.rootHash
                      )
                    }
                  />
                </tr>
              </tbody>
            )
          })}
      </table>
    </section>
  )
}

const mapDispatchToProps: DispatchProps = {
  removeRequestForAttestation: (
    claimId: Claims.Entry['id'],
    rootHash: IRequestForAttestation['rootHash']
  ) =>
    PersistentStore.store.dispatch(
      Claims.Store.removeRequestForAttestation(claimId, rootHash)
    ),
}

export default connect(null, mapDispatchToProps)(RequestForAttestationListView)
