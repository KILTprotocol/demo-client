import * as sdk from '@kiltprotocol/prototype-sdk'
import groupBy from 'lodash/groupBy'
import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import CTypeRepository from '../../services/CtypeRepository'
import * as Claims from '../../state/ducks/Claims'
import { State as ReduxState } from '../../state/PersistentStore'
import { CType, ICType } from '../../types/Ctype'
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
  legitimation: SelectAttestedClaimsLabels
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
      noClaimsForCTypeFound: `No claims for CTYPE '#{ctype}' found.`,
      noClaimsFound: `No claims found.`,
    },
  },
  legitimation: {
    buttons: {
      createClaim: 'Create legitimation',
      requestAttestation: 'Request attestation(s)',
    },
    text: {
      attestationsHeadline: 'Select attestation(s)',
      includePropertiesHeadline:
        'Select property(s) to include in Legitimation',
      noAttestationFound: 'No attestation found.',
      noClaimsForCTypeFound: `No legitimations for CTYPE '#{ctype}' found.`,
      noClaimsFound: `No legitimations found.`,
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

type Props = {
  claimEntries: Claims.Entry[] // redux
  cTypeHash?: sdk.ICType['hash']
  context?: 'default' | 'legitimation'
  onChange: (claimSelectionData: ClaimSelectionData) => void
}

type State = {
  cType?: CType
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

  public componentDidMount() {
    const { cTypeHash } = this.props

    if (cTypeHash) {
      CTypeRepository.findByHash(cTypeHash).then((cType: ICType) => {
        this.setState({ cType: CType.fromObject(cType) })
      })
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const { cTypeHash } = this.props
    if (prevProps.cTypeHash !== cTypeHash) {
      CTypeRepository.findByHash(cTypeHash).then((cType: ICType) => {
        this.setState({ cType: CType.fromObject(cType) })
      })
    }
  }

  public render() {
    const { cTypeHash } = this.props

    const relevantClaimEntries = this.getRelevantClaimEntries()
    const relevantCTypes = Object.keys(this.getRelevantClaimEntries())
    return (
      <section className="SelectAttestedClaims">
        {!!relevantCTypes && !!relevantCTypes.length
          ? relevantCTypes.map((_cTypeHash: Claims.Entry['claim']['cType']) =>
              this.getCTypeContainer(relevantClaimEntries, _cTypeHash)
            )
          : cTypeHash
          ? this.getNoClaimsForCtypeFound()
          : this.getNoClaimsFound()}
      </section>
    )
  }

  private getNoClaimsFound() {
    return (
      <div className="no-claim">
        <span>{this.labels.text.noClaimsFound}</span>
        <Link to={`/ctype`}>{this.labels.buttons.createClaim}</Link>
      </div>
    )
  }

  private getNoClaimsForCtypeFound() {
    const { cTypeHash } = this.props
    const { cType } = this.state
    return (
      <div className="no-claim">
        <span>
          {this.labels.text.noClaimsForCTypeFound.replace(
            '#{ctype}',
            cType ? cType.cType.metadata.title.default : cTypeHash || ''
          )}
        </span>
        <Link to={`/claim/new/${cTypeHash}`}>
          {this.labels.buttons.createClaim}
        </Link>
      </div>
    )
  }

  private getCTypeContainer(
    relevantClaimEntries: GroupedClaimEntries,
    cTypeHash: Claims.Entry['claim']['cType']
  ) {
    return (
      <div className="cType-container" key={cTypeHash}>
        <h4>
          CType <CTypePresentation cTypeHash={cTypeHash} inline={true} />
        </h4>
        {relevantClaimEntries[cTypeHash].map((claimEntry: Claims.Entry) =>
          claimEntry.attestations.length
            ? this.getSelectAttestedClaim(claimEntry)
            : ''
        )}
      </div>
    )
  }

  private getSelectAttestedClaim(claimEntry: Claims.Entry) {
    const { cTypeHash } = this.props
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
    const { claimEntries, cTypeHash } = this.props

    const relevantClaimEntries = cTypeHash
      ? claimEntries.filter(
          (claimEntry: Claims.Entry) => claimEntry.claim.cType === cTypeHash
        )
      : claimEntries

    return groupBy(
      relevantClaimEntries.filter(
        (claimEntry: Claims.Entry) =>
          claimEntry.attestations && claimEntry.attestations.length
      ),
      (claimEntry: Claims.Entry) => claimEntry.claim.cType
    )
  }

  private changeSelection(
    claimEntry: Claims.Entry,
    state: SelectAttestedClaimState
  ) {
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
}

const mapStateToProps = (state: ReduxState) => ({
  claimEntries: Claims.getClaims(state),
})

export default connect(mapStateToProps)(SelectAttestedClaims)
