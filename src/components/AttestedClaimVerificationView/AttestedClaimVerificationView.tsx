import { IAttestedClaim } from '@kiltprotocol/types'
import React from 'react'
import * as UiState from '../../state/ducks/UiState'
import { persistentStoreInstance } from '../../state/PersistentStore'

import { ICType, ICTypeWithMetadata } from '../../types/Ctype'
import AttestationStatus from '../AttestationStatus/AttestationStatus'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import { getCtypePropertyTitle } from '../../utils/CtypeUtils'
import './AttestedClaimVerificationView.scss'
import CTypeRepository from '../../services/CtypeRepository'

type Props = {
  attestedClaim: IAttestedClaim
  context?: string
  cType?: ICType
}

type State = {
  cType?: ICTypeWithMetadata
}

class AttestedClaimVerificationView extends React.Component<Props, State> {
  private static verifyAttestatedClaim(): void {
    persistentStoreInstance.store.dispatch(
      UiState.Store.refreshAttestationStatusAction()
    )
  }

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount(): void {
    this.setCType()
  }

  private setCType(): void {
    const { attestedClaim } = this.props

    CTypeRepository.findByHash(attestedClaim.attestation.cTypeHash).then(
      _cType => {
        if (_cType) this.setState({ cType: _cType })
      }
    )
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
    const { cType } = this.state

    let properties: Array<{ key: string; label: string; value: string }> = []
    if (cType) {
      const propertyNames = Object.keys(cType.cType.schema.properties)
      properties = propertyNames.map(propertyName => {
        const label = getCtypePropertyTitle(propertyName, {
          // TODO: What the hell? Why do we have two so similar types for a ctype with metadata?
          cType: cType.cType,
          metadata: cType.metaData.metadata,
          ctypeHash: cType.metaData.ctypeHash,
        })
        const value = AttestedClaimVerificationView.getPropertyValue(
          attestedClaim,
          propertyName
        )
        return {
          key: propertyName,
          label,
          value,
        }
      })
    } else {
      const propertyNames: string[] = Object.keys(
        attestedClaim.request.claim.contents
      )
      properties = propertyNames.map(propertyName => {
        return {
          key: propertyName,
          label: propertyName,
          value: AttestedClaimVerificationView.getPropertyValue(
            attestedClaim,
            propertyName
          ),
        }
      })
    }

    return (
      <div className="attributes">
        {properties.map(({ key, label, value }) => {
          return (
            <div key={key}>
              <label>{label}</label>
              <div>{value}</div>
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
