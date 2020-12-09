import { IAttestedClaim } from '@kiltprotocol/sdk-js'
import React from 'react'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'

import { ICType } from '../../types/Ctype'
import AttestationStatus from '../AttestationStatus/AttestationStatus'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import { getCtypePropertyTitle } from '../../utils/CtypeUtils'
import './AttestedClaimVerificationView.scss'

type Props = {
  attestedClaim: IAttestedClaim
  context?: string
  cType?: ICType
}

type State = {}

class AttestedClaimVerificationView extends React.Component<Props, State> {
  private static verifyAttestatedClaim(): void {
    PersistentStore.store.dispatch(
      UiState.Store.refreshAttestationStatusAction()
    )
  }

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  private getHeadline(): JSX.Element {
    const { attestedClaim, context }: Props = this.props
    const localContext = context != null ? context : 'Attested claim'

    return (
      <h2>
        {localContext && <span>{localContext}</span>}
        <ContactPresentation
          address={attestedClaim.attestation.owner}
          interactive
          inline
        />
        <CTypePresentation
          cTypeHash={attestedClaim.request.claim.cTypeHash}
          interactive
          linked
          inline
        />
        <AttestationStatus attestation={attestedClaim} />
      </h2>
    )
  }

  private static getPropertyValue(
    attestedClaim: IAttestedClaim,
    propertyName: string
  ): string {
    const { contents } = attestedClaim.request.claim

    if (!(propertyName in contents)) {
      return AttestedClaimVerificationView.BLOCK_CHAR.repeat(12)
    }
    return `${contents[propertyName]}`
  }

  private static readonly BLOCK_CHAR: string = '\u2588'

  private buildClaimPropertiesView(attestedClaim: IAttestedClaim): JSX.Element {
    const { cType } = this.props

    const propertyNames: string[] = Object.keys(
      attestedClaim.request.claimHashTree
    )

    return (
      <div className="attributes">
        {propertyNames.map((propertyName: string) => {
          const propertyTitle = cType
            ? getCtypePropertyTitle(propertyName, cType)
            : propertyName
          return (
            <div key={propertyName}>
              <label>{propertyTitle}</label>
              <div>
                {AttestedClaimVerificationView.getPropertyValue(
                  attestedClaim,
                  propertyName
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  public render(): JSX.Element {
    const { attestedClaim }: Props = this.props

    return (
      <section className="AttestedClaimVerificationView">
        {attestedClaim ? (
          <>
            {this.getHeadline()}
            <div className="container-actions">
              <button
                type="button"
                className="refresh"
                onClick={AttestedClaimVerificationView.verifyAttestatedClaim}
              />
            </div>
            {this.buildClaimPropertiesView(attestedClaim)}
          </>
        ) : (
          <div>Claim not found</div>
        )}
      </section>
    )
  }
}

export default AttestedClaimVerificationView
