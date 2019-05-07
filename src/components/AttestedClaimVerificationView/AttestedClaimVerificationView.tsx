import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import AttestationService from '../../services/AttestationService'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'

import { CType } from '../../types/Ctype'
import AttestationStatus from '../AttestationStatus/AttestationStatus'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import Spinner from '../Spinner/Spinner'

import './AttestedClaimVerificationView.scss'

type Props = {
  attestedClaim: sdk.IAttestedClaim
  context?: string
  cType?: CType
}

type State = {}

class AttestedClaimVerificationView extends React.Component<Props, State> {
  private static readonly BLOCK_CHAR: string = '\u2588'

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public render() {
    const { attestedClaim }: Props = this.props

    return (
      <section className="AttestedClaimVerificationView">
        {attestedClaim ? (
          <React.Fragment>
            {this.getHeadline()}
            <div className="container-actions">
              <button
                className="refresh"
                onClick={this.verifyAttestatedClaim}
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

  private verifyAttestatedClaim() {
    PersistentStore.store.dispatch(
      UiState.Store.refreshAttestationStatusAction()
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
          interactive={true}
          inline={true}
        />
        <CTypePresentation
          cTypeHash={attestedClaim.request.claim.cType}
          interactive={true}
          linked={true}
          inline={true}
        />
        <AttestationStatus attestedClaim={attestedClaim} />
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
              <div>{this.getPropertyValue(attestedClaim, propertyName)}</div>
            </div>
          )
        })}
      </div>
    )
  }

  private getPropertyValue(
    attestedClaim: sdk.IAttestedClaim,
    propertyName: string
  ) {
    const { contents } = attestedClaim.request.claim

    if (!contents.hasOwnProperty(propertyName)) {
      return AttestedClaimVerificationView.BLOCK_CHAR.repeat(12)
    } else {
      return contents[propertyName] + ''
    }
  }

  private getCtypePropertyTitle(propertyName: string): string {
    const { cType } = this.props
    return cType ? cType.getPropertyTitle(propertyName) : propertyName
  }
}

export default AttestedClaimVerificationView
