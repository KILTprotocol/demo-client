import React from 'react'
import * as sdk from '@kiltprotocol/prototype-sdk'

import { Contact } from '../../types/Contact'
import contactRepository from '../../services/ContactRepository'
import KiltIdenticon from '../KiltIdenticon/KiltIdenticon'
import Spinner from '../Spinner/Spinner'

import './AttestedClaimsListView.scss'

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
  onVerifyAttestation: (attestation: sdk.IAttestedClaim) => Promise<boolean>
}

type State = {
  canResolveAttesters: boolean
  unverifiedAttestations: string[]
  pendingAttestations: string[]
}

class AttestedClaimsListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.verifyAttestation = this.verifyAttestation.bind(this)
    this.verifyAttestations = this.verifyAttestations.bind(this)

    const { attestedClaims } = this.props
    this.state = {
      canResolveAttesters: false,
      pendingAttestations: [],
      unverifiedAttestations: attestedClaims.map(
        (attestedClaim: sdk.IAttestedClaim) => {
          return attestedClaim.attestation.claimHash
        }
      ),
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
    const { pendingAttestations } = this.state
    return (
      <section className="attestations">
        <div className="header">
          <h3>Attestations</h3>
          <button
            className="refresh"
            onClick={this.verifyAttestations}
            disabled={pendingAttestations.length > 0}
          />
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
                return (
                  <tr key={attestedClaim.attestation.signature}>
                    <td className="attesterName">
                      {attester ? (
                        <KiltIdenticon contact={attester} size={24} />
                      ) : (
                        attestedClaim.attestation.owner
                      )}
                    </td>
                    {this.isPending(attestedClaim.attestation) && (
                      <td className="status">
                        <Spinner size={20} color="#ef5a28" strength={3} />
                      </td>
                    )}
                    {!this.isPending(attestedClaim.attestation) && (
                      <td
                        className={
                          'status ' +
                          (this.isApproved(attestedClaim.attestation)
                            ? 'attested'
                            : 'revoked')
                        }
                      />
                    )}
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

  private isApproved(attestation: sdk.IAttestation): boolean {
    const { unverifiedAttestations: invalidAttestations } = this.state
    return !invalidAttestations.includes(attestation.claimHash)
  }

  private isPending(attestation: sdk.IAttestation): boolean {
    const { pendingAttestations } = this.state
    return pendingAttestations.includes(attestation.claimHash)
  }

  private getAttester(
    attesterAddress: Contact['publicIdentity']['address']
  ): Contact | undefined {
    return contactRepository.findByAddress(attesterAddress)
  }

  private verifyAttestations(): void {
    const { attestedClaims } = this.props
    attestedClaims.forEach(attestedClaim => {
      this.verifyAttestation(attestedClaim)()
    })
  }

  private verifyAttestation = (
    attestedClaim: sdk.IAttestedClaim
  ): (() => void) => () => {
    const { onVerifyAttestation } = this.props
    const { unverifiedAttestations, pendingAttestations } = this.state
    pendingAttestations.push(attestedClaim.attestation.claimHash)
    this.setState({
      pendingAttestations,
    })
    onVerifyAttestation(attestedClaim).then(verified => {
      const newState: any = {
        pendingAttestations: pendingAttestations.filter(
          (pendingAttestation: string) =>
            attestedClaim.attestation.claimHash !== pendingAttestation
        ),
      }

      if (verified) {
        newState.unverifiedAttestations = unverifiedAttestations.filter(
          (unverifiedAttestation: string) =>
            attestedClaim.attestation.claimHash !== unverifiedAttestation
        )
      }

      this.setState({
        ...newState,
      })
    })
  }
}

export default AttestedClaimsListView
