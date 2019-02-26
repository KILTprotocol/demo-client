import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { SelectAttestedClaimsLabels } from '../../containers/workflows/SelectAttestedClaims/SelectAttestedClaims'
import CTypeRepository from '../../services/CtypeRepository'
import * as Claims from '../../state/ducks/Claims'
import { State as ReduxState } from '../../state/PersistentStore'
import { CType, ICType } from '../../types/Ctype'

import './SelectAttestedClaim.scss'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

type Props = {
  claimEntry: Claims.Entry
  cTypeHash?: sdk.ICType['hash']
  labels: SelectAttestedClaimsLabels
  onChangeSelections: (claimEntry: Claims.Entry, state: State) => void
}

export type State = {
  allAttestedClaimsSelected?: boolean
  allClaimPropertiesSelected?: boolean
  cType?: CType
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

  public componentDidMount() {
    const { cTypeHash } = this.props
    if (cTypeHash) {
      CTypeRepository.findByHash(cTypeHash).then((cType: ICType) => {
        this.setState({ cType: CType.fromObject(cType) })
      })
    }
  }

  public render() {
    const { isSelected } = this.state
    return (
      <section className="SelectAttestedClaim">
        {this.getClaimSelect()}
        {isSelected && this.getClaimPropertySelect()}
        {isSelected && this.getAttestionsSelect()}
      </section>
    )
  }

  public selectionsChanged() {
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
        ? claimEntry.attestations
        : selectedAttestedClaims,
      selectedClaimProperties: allClaimPropertiesSelected
        ? propertyNames
        : selectedClaimProperties,
    })
  }

  private getClaimSelect() {
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

  private selectClaimEntry(event: ChangeEvent<HTMLInputElement>) {
    this.setState(
      {
        isSelected: event.target.checked,
      },
      this.selectionsChanged
    )
  }

  private getClaimPropertySelect() {
    const { labels, claimEntry } = this.props
    const { selectedClaimProperties, allClaimPropertiesSelected } = this.state

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
            const propertyTitle = this.getCtypePropertyTitle(propertyName)
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

  private getCtypePropertyTitle(propertyName: string): string {
    const { cType } = this.state
    return cType ? cType.getPropertyTitle(propertyName) : propertyName
  }

  private selectClaimProperty(
    propertyName: string,
    event: ChangeEvent<HTMLInputElement>
  ) {
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

  private getAttestionsSelect() {
    const { labels, claimEntry } = this.props
    const { allAttestedClaimsSelected } = this.state
    const { attestations } = claimEntry

    if (!attestations || !attestations.length) {
      return ''
    }
    // TODO: should we check the attestations against chain here?

    return attestations && attestations.length ? (
      <React.Fragment>
        <div className="attestations">
          <h4>
            {labels.text.attestationsHeadline}
            <label>
              <input type="checkbox" onChange={this.selectAllAttestations} />
              <span>All</span>
            </label>
          </h4>
          {attestations.map((attestedClaim: sdk.IAttestedClaim) => (
            <label
              key={attestedClaim.attestation.signature}
              className={allAttestedClaimsSelected ? 'selected-all' : ''}
            >
              <input
                type="checkbox"
                disabled={allAttestedClaimsSelected}
                onChange={this.selectAttestation.bind(this, attestedClaim)}
              />
              <span
                className={
                  attestedClaim.attestation.revoked ? 'unapproved' : 'approved'
                }
              >
                <ContactPresentation
                  address={attestedClaim.attestation.owner}
                />
              </span>
            </label>
          ))}
        </div>
      </React.Fragment>
    ) : (
      <div className="no-attestations">
        <span>{labels.text.noAttestationFound}</span>
        <Link to={`/claim/${claimEntry.id}`}>
          {labels.buttons.requestAttestation}
        </Link>
      </div>
    )
  }

  private selectAllAttestations(event: ChangeEvent<HTMLInputElement>) {
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

  private selectAllProperties(event: ChangeEvent<HTMLInputElement>) {
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
  ) {
    const { checked } = event.target
    const { selectedAttestedClaims } = this.state

    const attestationSelected = selectedAttestedClaims.find(
      (selectedAttestedClaim: sdk.IAttestedClaim) =>
        attestedClaim.attestation.signature ===
        selectedAttestedClaim.attestation.signature
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
              attestedClaim.attestation.signature !==
              selectedAttestedClaim.attestation.signature
          ),
        },
        this.selectionsChanged
      )
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  claimEntries: Claims.getClaims(state),
})

export default connect(mapStateToProps)(SelectAttestedClaim)
