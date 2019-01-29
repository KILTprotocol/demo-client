import * as sdk from '@kiltprotocol/prototype-sdk'
import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import Spinner from '../../components/Spinner/Spinner'
import ContactRepository from '../../services/ContactRepository'
import * as Claims from '../../state/ducks/Claims'
import { Contact } from '../../types/Contact'
import { Message } from '../../types/Message'
import Code from '../Code/Code'
import KiltIdenticon from '../KiltIdenticon/KiltIdenticon'

import './ClaimDetailView.scss'

type Props = {
  cancelable?: boolean
  claimEntry?: Claims.Entry
  onRemoveClaim?: (hash: sdk.IClaim['hash']) => void
  onRequestAttestation?: (hash: sdk.IClaim['hash']) => void
  onVerifyAttestation: (attestation: sdk.IAttestation) => Promise<boolean>
}

type State = {
  canResolveAttesters: boolean
  unverifiedAttestations: string[]
  pendingAttestations: string[]
}

class ClaimDetailView extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.handleDelete = this.handleDelete.bind(this)
    this.requestAttestation = this.requestAttestation.bind(this)
    this.verifyAttestation = this.verifyAttestation.bind(this)
    this.verifyAttestations = this.verifyAttestations.bind(this)

    const { claimEntry } = this.props
    if (claimEntry) {
      this.state = {
        canResolveAttesters: false,
        pendingAttestations: [],
        unverifiedAttestations: claimEntry.attestations.map(
          (attestation: sdk.IAttestation) => {
            return attestation.claimHash
          }
        ),
      }
    }

    setTimeout(() => {
      this.verifyAttestations()
    }, 500)
  }

  public componentDidMount() {
    ContactRepository.findAll().then(() => {
      this.setState({
        canResolveAttesters: true,
      })
    })
  }

  public render() {
    const { claimEntry }: Props = this.props

    return claimEntry ? (
      <section className="ClaimDetailView">
        <h1>{claimEntry.claim.alias}</h1>
        {this.getAttributes(claimEntry.claim)}
        {this.getAttestations(claimEntry.attestations)}
        {this.getActions()}
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }

  // TODO: use interface instead of class
  private getAttributes(claim: sdk.Claim) {
    const verified = claim ? claim.verifySignature() : false
    return (
      <div className="attributes">
        <div>
          <label>Hash</label>
          <div>{claim.hash}</div>
        </div>
        <div>
          <label>Ctype</label>
          <div>{claim.ctype}</div>
        </div>
        <div>
          <label>Signature</label>
          <div>{claim.signature}</div>
        </div>
        <div>
          <label>Owner</label>
          <div>{claim.owner}</div>
        </div>
        <div>
          <label>Verified</label>
          <div>{verified ? 'true' : 'false'}</div>
        </div>
        <div>
          <label>Contents</label>
          <div>
            <Code>{claim.contents}</Code>
          </div>
        </div>
      </div>
    )
  }

  private getAttestations(attestations: sdk.IAttestation[]) {
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
                <th className="identicon" />
                <th className="attesterName">Attester</th>
                <th className="status">Approved</th>
              </tr>
            </thead>
            <tbody>
              {attestations.map((attestation: sdk.IAttestation) => {
                const attester = this.getAttester(attestation.owner)
                return (
                  <tr key={attestation.signature}>
                    <td className="identicon">
                      {attester ? (
                        <KiltIdenticon contact={attester} size={24} />
                      ) : (
                        ''
                      )}
                    </td>
                    <td className="attesterName">
                      {attester ? attester.metaData.name : attestation.owner}
                    </td>
                    {this.isPending(attestation) && (
                      <td className="status">
                        <Spinner size={20} color="#ef5a28" strength={3} />
                      </td>
                    )}
                    {!this.isPending(attestation) && (
                      <td
                        className={
                          'status ' +
                          (this.isApproved(attestation)
                            ? 'approved'
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

  private getAttester(
    attesterAddress: Contact['publicIdentity']['address']
  ): Contact | undefined {
    return ContactRepository.findByAddress(attesterAddress)
  }

  private getActions() {
    const {
      onRemoveClaim,
      onRequestAttestation,
      cancelable,
    }: Props = this.props
    return (
      <div className="actions">
        {cancelable && (
          <Link className="cancel" to="/claim">
            Cancel
          </Link>
        )}
        {onRequestAttestation && (
          <button
            className="requestAttestation"
            onClick={this.requestAttestation}
          >
            Request Attestation
          </button>
        )}
        {onRemoveClaim && (
          <button className="deleteClaim" onClick={this.handleDelete}>
            Delete
          </button>
        )}
      </div>
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

  private handleDelete() {
    const { claimEntry, onRemoveClaim }: Props = this.props
    if (claimEntry && onRemoveClaim) {
      onRemoveClaim(claimEntry.claim.hash)
    }
  }

  private requestAttestation() {
    const { claimEntry, onRequestAttestation }: Props = this.props
    if (claimEntry && onRequestAttestation) {
      onRequestAttestation(claimEntry.claim.hash)
    }
  }

  private verifyAttestations(): void {
    const { claimEntry } = this.props

    if (claimEntry) {
      claimEntry.attestations.forEach(attestation => {
        this.verifyAttestation(attestation)()
      })
    }
  }

  private verifyAttestation = (
    attestation: sdk.IAttestation
  ): (() => void) => () => {
    const { onVerifyAttestation } = this.props
    const { unverifiedAttestations, pendingAttestations } = this.state
    pendingAttestations.push(attestation.claimHash)
    this.setState({
      pendingAttestations,
    })
    onVerifyAttestation(attestation).then(verified => {
      if (!verified) {
        return
      }
      this.setState({
        pendingAttestations: pendingAttestations.filter(
          (pendingAttestation: string) =>
            attestation.claimHash !== pendingAttestation
        ),
        unverifiedAttestations: unverifiedAttestations.filter(
          (unverifiedAttestation: string) =>
            attestation.claimHash !== unverifiedAttestation
        ),
      })
    })
  }
}

export default ClaimDetailView
