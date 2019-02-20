import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'

import { CType } from '../../types/Ctype'
import { Contact } from '../../types/Contact'
import KiltIdenticon from '../KiltIdenticon/KiltIdenticon'
import Spinner from '../Spinner/Spinner'

import './AttestedClaimVerificationView.scss'

type Props = {
  attester?: Contact
  attestedClaim: sdk.IAttestedClaim
  context?: 'legitimation'
  ctype?: CType
  onVerifyAttestatedClaim: (
    attestatedClaim: sdk.IAttestedClaim
  ) => Promise<boolean>
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
            <header>
              <h3>{context || 'Attested claim'}</h3>
              <button
                className="refresh"
                onClick={this.verifyAttestatedClaim}
                disabled={verificationPending}
              />
            </header>
            {this.buildClaimPropertiesView(attestedClaim)}
          </React.Fragment>
        ) : (
          <div>Claim not found</div>
        )}
      </section>
    )
  }

  private buildClaimPropertiesView(attestedClaim: sdk.IAttestedClaim) {
    const propertyNames: string[] = Object.keys(
      attestedClaim.request.claimHashTree
    )
    const { attester } = this.props
    const { verificationPending, verificationSucceeded } = this.state
    const attesterView = attester ? (
      <KiltIdenticon contact={attester} />
    ) : (
      attestedClaim.attestation.owner
    )
    const attestationStatusView = verificationPending ? (
      <Spinner size={20} color="#ef5a28" strength={3} />
    ) : (
      <div
        className={
          'status ' + (verificationSucceeded ? 'verified' : 'unverified')
        }
      />
    )

    return (
      propertyNames.length > 0 && (
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
          <div>
            <label>Attester</label>
            <div>{attesterView}</div>
          </div>
          <div>
            <label>Valid</label>
            <div className="attestationStatusView">{attestationStatusView}</div>
          </div>
        </div>
      )
    )
  }

  private getCtypePropertyTitle(propertyName: string): string {
    const { ctype } = this.props
    return ctype ? ctype.getPropertyTitle(propertyName) : propertyName
  }

  private verifyAttestatedClaim() {
    const { attestedClaim } = this.props
    const { onVerifyAttestatedClaim } = this.props
    this.setState({
      verificationPending: true,
      verificationSucceeded: false,
    })
    onVerifyAttestatedClaim(attestedClaim).then(verified => {
      this.setState({
        verificationPending: false,
        verificationSucceeded: verified,
      })
    })
  }
}

export default AttestedClaimVerificationView
