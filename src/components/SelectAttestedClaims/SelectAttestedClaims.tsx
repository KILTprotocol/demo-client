import * as sdk from '@kiltprotocol/sdk-js'
import groupBy from 'lodash/groupBy'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { Link } from 'react-router-dom'

import * as Claims from '../../state/ducks/Claims'
import { State as ReduxState } from '../../state/PersistentStore'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import SelectAttestedClaim, {
  State as SelectAttestedClaimState,
} from '../SelectAttestedClaim/SelectAttestedClaim'
import '../SelectAttestedClaim/SelectAttestedClaim.scss'

import './SelectAttestedClaims.scss'

export type SelectAttestedClaimsLabels = {
  buttons: {
    [key: string]: string
  }
  text: {
    [key: string]: string
  }
}

type AllLabels = {
  default: SelectAttestedClaimsLabels
  term: SelectAttestedClaimsLabels
}

const LABELS: AllLabels = {
  default: {
    buttons: {
      createClaim: 'Create claim',
      requestAttestation: 'Request attestation(s)',
    },
    text: {
      attestationsHeadline: 'Select attestation(s)',
      includePropertiesHeadline: 'Select property(s) to include in Claim',
      noAttestationFound: 'No attestation found.',
      noClaimsForCTypeFound: `No attested claims found for CTYPE. `,
      noClaimsFound: `No claims found.`,
    },
  },
  term: {
    buttons: {
      createClaim: 'Create Terms',
      requestAttestation: 'Request attestation(s)',
    },
    text: {
      attestationsHeadline: 'Select attestation(s)',
      includePropertiesHeadline: 'Select property(s) to include in Terms',
      noAttestationFound: 'No attestation found.',
      noClaimsForCTypeFound: `No attested claims found for CTYPE. `,
      noClaimsFound: `No terms found.`,
    },
  },
}

type GroupedClaimEntries = {
  [cTypeHash: string]: Claims.Entry[]
}

export type ClaimSelectionData = {
  [key: string]: {
    claimEntry: Claims.Entry
    state: SelectAttestedClaimState
  }
}

type StateProps = {
  claimEntries: Claims.Entry[]
}

type OwnProps = {
  cTypeHashes?: Array<sdk.ICType['hash'] | null>
  context?: 'default' | 'terms'
  onChange: (claimSelectionData: ClaimSelectionData) => void
}

type Props = StateProps & OwnProps

type State = {
  claimSelectionData: ClaimSelectionData
}

class SelectAttestedClaims extends React.Component<Props, State> {
  private labels: SelectAttestedClaimsLabels

  constructor(props: Props) {
    super(props)
    this.state = {
      claimSelectionData: {},
    }

    this.labels = LABELS[props.context || 'default']

    this.changeSelection = this.changeSelection.bind(this)
  }

  private getCTypeContainers(): JSX.Element | JSX.Element[] {
    const { cTypeHashes } = this.props
    const requestedCTypeHashes = cTypeHashes || []
    const relevantClaimEntries = this.getRelevantClaimEntries()
    const cTypeHashesWithClaims = Object.keys(relevantClaimEntries)

    let chosenCTypeHashes

    if (requestedCTypeHashes.length) chosenCTypeHashes = cTypeHashes
    else if (cTypeHashesWithClaims.length)
      chosenCTypeHashes = cTypeHashesWithClaims

    if (!chosenCTypeHashes) {
      return (
        <div className="no-claim">
          <span>{this.labels.text.noClaimsFound}</span>
          <Link to="/ctype">{this.labels.buttons.createClaim}</Link>
        </div>
      )
    }

    return (chosenCTypeHashes || []).map(
      (cTypeHash: Claims.Entry['claim']['cTypeHash']) => (
        <div className="cType-container" key={cTypeHash}>
          <h4>
            CType{' '}
            <CTypePresentation
              cTypeHash={cTypeHash}
              inline
              interactive
              linked
            />
          </h4>
          {relevantClaimEntries[cTypeHash] ? (
            relevantClaimEntries[cTypeHash].map((claimEntry: Claims.Entry) =>
              this.getSelectAttestedClaim(claimEntry, cTypeHash)
            )
          ) : (
            <div className="no-claim">
              <span>{this.labels.text.noClaimsForCTypeFound}</span>
              <Link to={`/claim/new/${cTypeHash}`}>
                {this.labels.buttons.createClaim}
              </Link>
            </div>
          )}
        </div>
      )
    )
  }

  private getSelectAttestedClaim(
    claimEntry: Claims.Entry,
    cTypeHash?: Claims.Entry['claim']['cTypeHash']
  ): JSX.Element {
    return (
      <SelectAttestedClaim
        key={claimEntry.id}
        labels={this.labels}
        onChangeSelections={this.changeSelection}
        claimEntry={claimEntry}
        cTypeHash={cTypeHash}
      />
    )
  }

  private getRelevantClaimEntries(): GroupedClaimEntries {
    const { claimEntries, cTypeHashes } = this.props

    const relevantClaimEntries =
      cTypeHashes && cTypeHashes.length
        ? claimEntries.filter((claimEntry: Claims.Entry) =>
            cTypeHashes.includes(claimEntry.claim.cTypeHash)
          )
        : claimEntries

    return groupBy(
      relevantClaimEntries.filter(
        (claimEntry: Claims.Entry) =>
          claimEntry.attestations && claimEntry.attestations.length
      ),
      (claimEntry: Claims.Entry) => claimEntry.claim.cTypeHash
    )
  }

  private changeSelection(
    claimEntry: Claims.Entry,
    state: SelectAttestedClaimState
  ): void {
    const { onChange } = this.props
    const { claimSelectionData } = this.state

    if (state.isSelected && state.selectedAttestedClaims.length) {
      claimSelectionData[claimEntry.id] = { claimEntry, state }
    } else {
      delete claimSelectionData[claimEntry.id]
    }

    this.setState({
      claimSelectionData,
    })

    if (onChange) {
      onChange(claimSelectionData)
    }
  }

  public render(): JSX.Element {
    return (
      <section className="SelectAttestedClaims">
        {this.getCTypeContainers()}
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  claimEntries: Claims.getClaims(state),
})

export default connect(mapStateToProps)(SelectAttestedClaims)
