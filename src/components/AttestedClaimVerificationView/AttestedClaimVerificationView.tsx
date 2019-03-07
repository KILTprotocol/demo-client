import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import attestationService from '../../services/AttestationService'

import { CType } from '../../types/Ctype'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import Spinner from '../Spinner/Spinner'

import './AttestedClaimVerificationView.scss'

type Props = {
  attestedClaim: sdk.IAttestedClaim
  context?: string
  cType?: CType
}

type State = {
  verificationPending: boolean
  verificationSucceeded: boolean
}

class AttestedClaimVerificationView extends React.Component<Props, State> {
  private static readonly BLOCK_CHAR: string = '\u2588'

  constructor(props: Props) {
    super(props)
    this.verifyAttestatedClaim = this.verifyAttestatedClaim.bind(this)
    this.state = {
      verificationPending: true,
      verificationSucceeded: false,
    }
    setTimeout(() => {
      this.verifyAttestatedClaim()
    }, 500)
  }

  public render() {
    const { attestedClaim, context }: Props = this.props
    const { verificationPending } = this.state

    return (
      <section className="AttestedClaimVerificationView">
        {attestedClaim ? (
          <React.Fragment>
            {this.getHeadline()}
            <div className="refresh">
              <button
                onClick={this.verifyAttestatedClaim}
                disabled={verificationPending}
              />
            </div>
            {this.buildClaimPropertiesView(attestedClaim)}
          </React.Fragment>
        ) : (
          <div>Claim not found</div>
        )}
      </section>
    )
  }

  private getHeadline() {
    const { attestedClaim, context }: Props = this.props
    const _context = context != null ? context : 'Attested claim'

    return (
      <h2>
        {_context && <span>{_context}</span>}
        <ContactPresentation
          address={attestedClaim.attestation.owner}
          inline={true}
        />
        <CTypePresentation
          cTypeHash={attestedClaim.request.claim.cType}
          linked={false}
          inline={true}
        />
        {this.getAttestationStatusView()}
      </h2>
    )
  }

  private buildClaimPropertiesView(attestedClaim: sdk.IAttestedClaim) {
    const propertyNames: string[] = Object.keys(
      attestedClaim.request.claimHashTree
    )

    return (
      <div className="attributes">
        {propertyNames.map((propertyName: string) => {
          const propertyTitle = this.getCtypePropertyTitle(propertyName)
          return (
            <div key={propertyName}>
              <label>{propertyTitle}</label>
              <div>
                {attestedClaim.request.claim.contents[propertyName] ||
                  AttestedClaimVerificationView.BLOCK_CHAR.repeat(12)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  private getAttestationStatusView() {
    const { verificationPending, verificationSucceeded } = this.state
    return verificationPending ? (
      <Spinner size={20} color="#ef5a28" strength={3} />
    ) : (
      <span
        className={
          'status ' + (verificationSucceeded ? 'verified' : 'unverified')
        }
      />
    )
  }

  private getCtypePropertyTitle(propertyName: string): string {
    const { cType } = this.props
    return cType ? cType.getPropertyTitle(propertyName) : propertyName
  }

  private verifyAttestatedClaim() {
    const { attestedClaim } = this.props
    this.setState({
      verificationPending: true,
      verificationSucceeded: false,
    })
    attestationService.verifyAttestatedClaim(attestedClaim).then(verified => {
      this.setState({
        verificationPending: false,
        verificationSucceeded: verified,
      })
    })
  }
}

export default AttestedClaimVerificationView
