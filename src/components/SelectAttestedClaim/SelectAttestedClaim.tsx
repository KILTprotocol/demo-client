import * as sdk from '@kiltprotocol/sdk-js'
import React, { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import isEqual from 'lodash/isEqual'

import { buildMatchingAttestedClaims } from '../../utils/AttestedClaimUtils/AttestedClaimUtils'
import CTypeRepository from '../../services/CtypeRepository'
import * as Claims from '../../state/ducks/Claims'
import { ICType, ICTypeWithMetadata } from '../../types/Ctype'
import AttestationStatus from '../AttestationStatus/AttestationStatus'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import { SelectAttestedClaimsLabels } from '../SelectAttestedClaims/SelectAttestedClaims'

import './SelectAttestedClaim.scss'
import { getCtypePropertyTitle } from '../../utils/CtypeUtils'

type Props = {
  claimEntry: Claims.Entry
  cTypeHash?: sdk.ICType['hash']
  labels: SelectAttestedClaimsLabels
  onChangeSelections: (claimEntry: Claims.Entry, state: State) => void
}

export type State = {
  allAttestedClaimsSelected?: boolean
  allClaimPropertiesSelected?: boolean
  cType?: ICType
  isSelected: boolean
  selectedAttestedClaims: sdk.IAttestedClaim[]
  selectedClaimProperties: string[]
}

class SelectAttestedClaim extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      isSelected: false,
      selectedAttestedClaims: [],
      selectedClaimProperties: [],
    }
    this.selectClaimEntry = this.selectClaimEntry.bind(this)
    this.selectAllAttestations = this.selectAllAttestations.bind(this)
    this.selectAllProperties = this.selectAllProperties.bind(this)
  }

  public componentDidMount(): void {
    const { cTypeHash } = this.props
    if (cTypeHash) {
      CTypeRepository.findByHash(cTypeHash).then(
        (cType: ICTypeWithMetadata) => {
          const cTypeReference: ICType = {
            cType: cType.cType,
            metadata: cType.metaData.metadata,
            ctypeHash: cType.cType.hash,
          }
          this.setState({ cType: cTypeReference })
        }
      )
    }
  }

  private getClaimSelect(): JSX.Element {
    const { claimEntry } = this.props

    return (
      <div className="select-claim">
        <label key={claimEntry.id}>
          <input type="checkbox" onChange={this.selectClaimEntry} />
          <span>{claimEntry.meta.alias}</span>
        </label>
      </div>
    )
  }

  private getClaimPropertySelect(): false | JSX.Element {
    const { labels, claimEntry } = this.props
    const { allClaimPropertiesSelected, cType } = this.state

    const propertyNames: string[] = Object.keys(claimEntry.claim.contents)

    return (
      propertyNames.length > 0 && (
        <div className="properties">
          <h4>
            {labels.text.includePropertiesHeadline}
            <label>
              <input type="checkbox" onChange={this.selectAllProperties} />
              <span>All</span>
            </label>
          </h4>
          {propertyNames.map((propertyName: string) => {
            const propertyTitle = cType
              ? getCtypePropertyTitle(propertyName, cType)
              : propertyName
            return (
              <label
                key={propertyName}
                className={allClaimPropertiesSelected ? 'selected-all' : ''}
              >
                <input
                  type="checkbox"
                  disabled={allClaimPropertiesSelected}
                  onChange={this.selectClaimProperty.bind(this, propertyName)}
                />
                <span>{propertyTitle}</span>
              </label>
            )
          })}
        </div>
      )
    )
  }

  private getAttestionsSelect(): '' | JSX.Element {
    const { labels, claimEntry } = this.props
    const { allAttestedClaimsSelected } = this.state
    const { attestations } = claimEntry
    const attestedClaims = buildMatchingAttestedClaims(claimEntry)

    if (!attestations || !attestations.length) {
      return ''
    }
    // TODO: should we check the attestations against chain here?

    return attestations && attestations.length ? (
      <>
        <div className="attestations">
          <h4>
            {labels.text.attestationsHeadline}
            <label>
              <input type="checkbox" onChange={this.selectAllAttestations} />
              <span>All</span>
            </label>
          </h4>
          {attestedClaims.map((attestedClaim: sdk.IAttestedClaim) => (
            <label
              key={`${attestedClaim.attestation.claimHash}-${attestedClaim.attestation.owner}`}
              className={allAttestedClaimsSelected ? 'selected-all' : ''}
            >
              <input
                type="checkbox"
                disabled={allAttestedClaimsSelected}
                onChange={this.selectAttestation.bind(this, attestedClaim)}
              />
              <span>
                <AttestationStatus attestation={attestedClaim} />
                <ContactPresentation
                  address={attestedClaim.attestation.owner}
                  interactive
                  inline
                />
              </span>
            </label>
          ))}
        </div>
      </>
    ) : (
      <div className="no-attestations">
        <span>{labels.text.noAttestationFound} </span>
        <Link to={`/claim/${claimEntry.id}`}>
          {labels.buttons.requestAttestation}
        </Link>
      </div>
    )
  }

  public selectionsChanged(): void {
    const { claimEntry, onChangeSelections } = this.props
    const {
      allAttestedClaimsSelected,
      allClaimPropertiesSelected,
      isSelected,
      selectedAttestedClaims,
      selectedClaimProperties,
    } = this.state

    const propertyNames: string[] = Object.keys(claimEntry.claim.contents)

    onChangeSelections(claimEntry, {
      isSelected,
      selectedAttestedClaims: allAttestedClaimsSelected
        ? buildMatchingAttestedClaims(claimEntry)
        : selectedAttestedClaims,
      selectedClaimProperties: allClaimPropertiesSelected
        ? propertyNames
        : selectedClaimProperties,
    })
  }

  private selectClaimEntry(event: ChangeEvent<HTMLInputElement>): void {
    this.setState(
      {
        isSelected: event.target.checked,
      },
      this.selectionsChanged
    )
  }

  private selectClaimProperty(
    propertyName: string,
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const { checked } = event.target
    let { selectedClaimProperties } = this.state

    if (checked) {
      selectedClaimProperties.push(propertyName)
    } else {
      selectedClaimProperties = selectedClaimProperties.filter(
        (_propertyName: string) => {
          return _propertyName !== propertyName
        }
      )
    }
    this.setState(
      {
        selectedClaimProperties,
      },
      this.selectionsChanged
    )
  }

  private selectAllAttestations(event: ChangeEvent<HTMLInputElement>): void {
    const { checked } = event.target

    this.setState(
      {
        allAttestedClaimsSelected: checked,
      },
      () => {
        this.selectionsChanged()
      }
    )
  }

  private selectAllProperties(event: ChangeEvent<HTMLInputElement>): void {
    const { checked } = event.target

    this.setState(
      {
        allClaimPropertiesSelected: checked,
      },
      () => {
        this.selectionsChanged()
      }
    )
  }

  private selectAttestation(
    attestedClaim: sdk.IAttestedClaim,
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const { checked } = event.target
    const { selectedAttestedClaims } = this.state

    const attestationSelected = selectedAttestedClaims.find(
      (selectedAttestedClaim: sdk.IAttestedClaim) =>
        isEqual(selectedAttestedClaim, attestedClaim)
    )

    if (checked && !attestationSelected) {
      this.setState(
        {
          selectedAttestedClaims: [...selectedAttestedClaims, attestedClaim],
        },
        this.selectionsChanged
      )
    } else if (attestationSelected) {
      this.setState(
        {
          selectedAttestedClaims: selectedAttestedClaims.filter(
            (selectedAttestedClaim: sdk.IAttestedClaim) =>
              attestedClaim.attestation.owner !==
              selectedAttestedClaim.attestation.owner
          ),
        },
        this.selectionsChanged
      )
    }
  }

  public render(): JSX.Element {
    const { isSelected } = this.state
    return (
      <section className="SelectAttestedClaim">
        {this.getClaimSelect()}
        {isSelected && this.getClaimPropertySelect()}
        {isSelected && this.getAttestionsSelect()}
      </section>
    )
  }
}

export default SelectAttestedClaim
