import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'

import attestationService from '../../services/AttestationService'
import contactRepository from '../../services/ContactRepository'
import { Contact } from '../../types/Contact'
import KiltIdenticon from '../KiltIdenticon/KiltIdenticon'
import Spinner from '../Spinner/Spinner'

import './AttestedClaimsListView.scss'

const enum STATUS {
  PENDING = 'pending',
  UNVERIFIED = 'unverified',
  ATTESTED = 'attested',
}

type AttestationStatus = {
  [signature: string]: STATUS
}

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
}

type State = {
  canResolveAttesters: boolean
  attestationStatus: AttestationStatus
}

class AttestedClaimsListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.verifyAttestation = this.verifyAttestation.bind(this)
    this.verifyAttestations = this.verifyAttestations.bind(this)

    this.state = {
      attestationStatus: {},
      canResolveAttesters: false,
    }
    setTimeout(() => {
      this.verifyAttestations()
    }, 500)
  }

  public componentDidMount() {
    contactRepository.findAll().then(() => {
      this.setState({
        canResolveAttesters: true,
      })
    })
  }

  public render() {
    const { attestedClaims }: Props = this.props

    return attestedClaims ? (
      <section className="AttestedClaimsListView">
        <h1>Attested Claims</h1>
        {this.getAttestations(attestedClaims)}
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }

  private getAttestations(attestations: sdk.IAttestedClaim[]) {
    const { attestationStatus } = this.state
    return (
      <section className="attestations">
        <div className="header">
          <h3>Attestations</h3>
          <button className="refresh" onClick={this.verifyAttestations} />
        </div>
        {!!attestations && !!attestations.length ? (
          <table>
            <thead>
              <tr>
                <th className="attesterName">Attester</th>
                <th className="status">Attested</th>
              </tr>
            </thead>
            <tbody>
              {attestations.map((attestedClaim: sdk.IAttestedClaim) => {
                const attester = this.getAttester(
                  attestedClaim.attestation.owner
                )
                const { signature } = attestedClaim.attestation
                return (
                  <tr key={attestedClaim.attestation.signature}>
                    <td className="attesterName">
                      {attester ? (
                        <KiltIdenticon contact={attester} />
                      ) : (
                        attestedClaim.attestation.owner
                      )}
                    </td>
                    <td className={`status ${attestationStatus[signature]}`}>
                      {attestationStatus[signature] === STATUS.PENDING && (
                        <Spinner size={20} color="#ef5a28" strength={3} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div>No Attestations found.</div>
        )}
      </section>
    )
  }

  private getAttester(
    attesterAddress: Contact['publicIdentity']['address']
  ): Contact | undefined {
    return contactRepository.findByAddress(attesterAddress)
  }

  private verifyAttestations(): void {
    const { attestedClaims } = this.props
    attestedClaims.forEach(attestedClaim => {
      this.verifyAttestation(attestedClaim)
    })
  }

  private verifyAttestation(attestedClaim: sdk.IAttestedClaim) {
    const { attestationStatus } = this.state
    const { signature } = attestedClaim.attestation

    // if we are currently already fetching - cancel
    if (attestationStatus[signature] === STATUS.PENDING) {
      return
    }

    attestationStatus[signature] = STATUS.PENDING

    this.setState({
      attestationStatus,
    })

    attestationService
      .verifyAttestatedClaim(attestedClaim)
      .then((verified: boolean) => {
        if (verified) {
          attestationStatus[signature] = STATUS.ATTESTED
        } else {
          attestationStatus[signature] = STATUS.UNVERIFIED
        }

        this.setState({
          attestationStatus,
        })
      })
  }
}

export default AttestedClaimsListView
