import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'

import attestationService from '../../services/AttestationService'
import contactRepository from '../../services/ContactRepository'
import AttestedClaimVerificationView from '../AttestedClaimVerificationView/AttestedClaimVerificationView'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import Spinner from '../Spinner/Spinner'

import './AttestedClaimsListView.scss'

type Labels = {
  default: { [key: string]: string }
  legitimations: { [key: string]: string }
}

const LABELS: Labels = {
  default: {
    emptyList: 'No attestations found.',
    h2_multi: 'Attested claims',
    h2_single: 'Attested claim',
  },
  legitimations: {
    emptyList: 'No legitimations found.',
    h2_multi: 'Legitimations',
    h2_single: 'Legitimation',
  },
}

const enum STATUS {
  PENDING = 'pending',
  UNVERIFIED = 'unverified',
  ATTESTED = 'attested',
}

type AttestationStatus = {
  [owner: string]: STATUS
}

type Props = {
  attestedClaims: sdk.IAttestedClaim[]

  context?: 'legitimations'
  delegationId?: sdk.IDelegationNode['id']

  onToggleChildOpen?: (closeCallback?: () => void | undefined) => void
}

type State = {
  attestationStatus: AttestationStatus
  canResolveAttesters: boolean
  labels: { [key: string]: string }

  closeOpenedChild?: () => void
  openedAttestedClaim?: sdk.IAttestedClaim
}

class AttestedClaimsListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.verifyAttestation = this.verifyAttestation.bind(this)
    this.verifyAttestations = this.verifyAttestations.bind(this)

    const context =
      props.context && LABELS[props.context] ? props.context : 'default'

    this.state = {
      attestationStatus: {},
      canResolveAttesters: false,
      labels: LABELS[context],
    }

    this.toggleChildOpen = this.toggleChildOpen.bind(this)
    this.closeOpenedChild = this.closeOpenedChild.bind(this)

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
    const { attestedClaims, context, delegationId } = this.props
    const { labels, openedAttestedClaim } = this.state

    const classes = [
      'AttestedClaimsListView',
      openedAttestedClaim ? 'opened' : '',
    ]

    return attestedClaims ? (
      <section className={classes.join(' ')}>
        <div className={context}>
          <h2>{labels.h2_multi}</h2>
          {this.getLegitimations(attestedClaims, delegationId)}
        </div>
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }

  private getLegitimations(
    attestedClaims: Props['attestedClaims'],
    delegationId: Props['delegationId']
  ) {
    if (!delegationId && !attestedClaims.length) {
      return <div>{LABELS.legitimations.emptyList}</div>
    }
    return (
      <>
        {this.getAttestations(attestedClaims)}
        {this.getDelegation(delegationId)}
      </>
    )
  }

  private getAttestations(attestations: sdk.IAttestedClaim[]) {
    const { attestationStatus, labels, openedAttestedClaim } = this.state
    return (
      <section className="attestations">
        {openedAttestedClaim ? (
          <h2 onClick={this.toggleOpen.bind(this, openedAttestedClaim)}>
            {LABELS.default.h2_single}
          </h2>
        ) : (
          <h2>{LABELS.default.h2_multi}</h2>
        )}
        <div className="container-actions">
          {!!attestations && !!attestations.length && (
            <button className="refresh" onClick={this.verifyAttestations} />
          )}
          {openedAttestedClaim && (
            <button
              className="close"
              onClick={this.toggleOpen.bind(this, openedAttestedClaim)}
            />
          )}
        </div>

        {!!attestations && !!attestations.length ? (
          <table className={openedAttestedClaim ? 'opened' : ''}>
            <thead>
              <tr>
                <th className="attester">Attester</th>
                <th className="cType">CType</th>
                <th className="status">Attested</th>
                <th className="actionsTd" />
              </tr>
            </thead>

            {attestations.map((attestedClaim: sdk.IAttestedClaim) => {
              const { owner } = attestedClaim.attestation
              const opened = attestedClaim === openedAttestedClaim

              return (
                <tbody
                  key={attestedClaim.attestation.claimHash}
                  className={opened ? 'opened' : ''}
                >
                  <tr>
                    <td className="attester">
                      <ContactPresentation
                        address={attestedClaim.attestation.owner}
                      />
                    </td>
                    <td className="cType">
                      <CTypePresentation
                        cTypeHash={attestedClaim.attestation.cTypeHash}
                      />
                    </td>
                    <td className={`status ${attestationStatus[owner]}`}>
                      {attestationStatus[owner] === STATUS.PENDING && (
                        <Spinner size={20} color="#ef5a28" strength={3} />
                      )}
                    </td>
                    <td className="actionsTd">
                      <div>
                        <button
                          className="open"
                          onClick={this.toggleOpen.bind(this, attestedClaim)}
                        />
                      </div>
                    </td>
                  </tr>

                  {opened && (
                    <tr>
                      <td className="listDetailContainer" colSpan={3}>
                        <AttestedClaimsListView
                          attestedClaims={attestedClaim.request.legitimations}
                          delegationId={attestedClaim.request.delegationId}
                          context="legitimations"
                          onToggleChildOpen={this.toggleChildOpen}
                        />

                        <div className="back" onClick={this.closeOpenedChild} />

                        <AttestedClaimVerificationView
                          context=""
                          attestedClaim={attestedClaim}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </table>
        ) : (
          <div>{LABELS.default.emptyList}</div>
        )}
      </section>
    )
  }

  private getDelegation(delegationId: Props['delegationId']) {
    return (
      <div className="delegation">
        <h2>Delegation</h2>
        {delegationId ? (
          <div>{delegationId}</div>
        ) : (
          <div>No delegation found.</div>
        )}
      </div>
    )
  }

  private toggleOpen(attestedClaim: sdk.IAttestedClaim | undefined) {
    const { onToggleChildOpen } = this.props
    const { openedAttestedClaim } = this.state

    this.setState({
      openedAttestedClaim:
        attestedClaim === openedAttestedClaim ? undefined : attestedClaim,
    })

    if (onToggleChildOpen) {
      onToggleChildOpen(
        attestedClaim === openedAttestedClaim
          ? undefined
          : () => {
              this.toggleOpen(openedAttestedClaim)
            }
      )
    }
  }

  private toggleChildOpen(closeCallback?: () => void | undefined) {
    this.setState({ closeOpenedChild: closeCallback })
  }

  private closeOpenedChild() {
    const { closeOpenedChild } = this.state
    if (closeOpenedChild) {
      closeOpenedChild()
    }
  }

  private verifyAttestations(): void {
    const { attestedClaims } = this.props
    attestedClaims.forEach(attestedClaim => {
      this.verifyAttestation(attestedClaim)
    })
  }

  private verifyAttestation(attestedClaim: sdk.IAttestedClaim) {
    const { attestationStatus } = this.state
    const { owner } = attestedClaim.attestation

    // if we are currently already fetching - cancel
    if (attestationStatus[owner] === STATUS.PENDING) {
      return
    }

    attestationStatus[owner] = STATUS.PENDING

    this.setState({
      attestationStatus,
    })

    attestationService
      .verifyAttestatedClaim(attestedClaim)
      .then((verified: boolean) => {
        if (verified) {
          attestationStatus[owner] = STATUS.ATTESTED
        } else {
          attestationStatus[owner] = STATUS.UNVERIFIED
        }

        this.setState({
          attestationStatus,
        })
      })
  }
}

export default AttestedClaimsListView
