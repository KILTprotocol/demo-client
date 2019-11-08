import * as sdk from '@kiltprotocol/sdk-js'
import * as React from 'react'
import { ReactNode } from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import * as Claims from '../../state/ducks/Claims'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'
import { ICType, CTypeMetadata } from '../../types/Ctype'
import SelectCTypesModal from '../Modal/SelectCTypesModal'

type SelectOption = {
  baseValue: Claims.Entry['meta']['alias']
  label: ReactNode
  value: string
}

type Props = RouteComponentProps<{}> & {
  closeMenuOnSelect?: boolean
  claims?: Claims.Entry[]
  cTypeHash?: ICType['cType']['hash']
  isMulti?: boolean
  placeholder?: string
  preSelectedClaimEntries?: Claims.Entry[]

  onChange?: (selectedClaims: Claims.Entry[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {
  claims: Claims.Entry[]
  showSelectCTypesModal: boolean
}

class SelectClaims extends React.Component<Props, State> {
  public static defaultProps = {
    closeMenuOnSelect: true,
    isMulti: false,
    showAttested: true,
  }

  private filterConfig: Config = {
    ignoreAccents: true,
    ignoreCase: true,
    matchFrom: 'any',
    trim: true,
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      claims: [],
      showSelectCTypesModal: false,
    }

    this.onChange = this.onChange.bind(this)
    this.handleClaimCreateRequest = this.handleClaimCreateRequest.bind(this)
    this.onSelectCType = this.onSelectCType.bind(this)
  }

  public componentDidMount() {
    const { claims, cTypeHash } = this.props

    if (!claims || !claims.length) {
      if (cTypeHash) {
        this.setState({
          claims: Claims.getClaimsByCTypeHash(
            PersistentStore.store.getState(),
            cTypeHash
          ),
        })
      } else {
        this.setState({
          claims: Claims.getClaims(PersistentStore.store.getState()),
        })
      }
    }
  }

  public render() {
    const {
      claims,
      closeMenuOnSelect,
      cTypeHash,
      isMulti,
      placeholder,
      preSelectedClaimEntries,

      onMenuOpen,
      onMenuClose,
    } = this.props
    const { showSelectCTypesModal } = this.state

    const defaultOptions = (preSelectedClaimEntries || []).map(
      (claim: Claims.Entry) => this.getOption(claim)
    )

    const _claims =
      claims && claims.length
        ? claims
        : cTypeHash
        ? Claims.getClaimsByCTypeHash(
            PersistentStore.store.getState(),
            cTypeHash
          )
        : Claims.getClaims(PersistentStore.store.getState())

    const options: SelectOption[] = _claims.map(
      (claim: Claims.Entry): SelectOption => this.getOption(claim)
    )

    return !!_claims && !!_claims.length ? (
      <Select
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable={isMulti && _claims.length > 1}
        isSearchable={false}
        isMulti={isMulti && _claims.length > 1}
        closeMenuOnSelect={closeMenuOnSelect}
        name="selectClaims"
        options={options}
        defaultValue={defaultOptions}
        placeholder={placeholder || `Select claim${isMulti ? 's' : ''}…`}
        filterOption={createFilter(this.filterConfig)}
        onChange={this.onChange}
        onMenuOpen={onMenuOpen}
        onMenuClose={onMenuClose}
      />
    ) : (
      <>
        <div>
          <span>No claims found. You might wanna create </span>
          <Link to="" onClick={this.handleClaimCreateRequest}>
            create
          </Link>
          <span> one first.</span>
        </div>
        {!cTypeHash && showSelectCTypesModal && (
          <SelectCTypesModal onConfirm={this.onSelectCType} showOnInit={true} />
        )}
      </>
    )
  }

  private getOption(claim: Claims.Entry): SelectOption {
    {
      const isApproved =
        claim.attestations &&
        claim.attestations.find(
          (attestedClaim: sdk.IAttestedClaim) =>
            !attestedClaim.attestation.revoked
        )
      return {
        baseValue: claim.meta.alias,
        label: (
          <span className={isApproved ? 'attested' : 'revoked'}>
            {claim.meta.alias}
          </span>
        ),
        value: claim.id,
      }
    }
  }

  private handleClaimCreateRequest(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    const { cTypeHash } = this.props

    if (cTypeHash) {
      this.goToClaimCreate(cTypeHash)
    } else {
      this.setState({
        showSelectCTypesModal: true,
      })
    }
  }

  private onSelectCType(selectedCtypes: CTypeMetadata[]) {
    this.goToClaimCreate(selectedCtypes[0].cType.hash)
  }

  private goToClaimCreate(cTypeHash: ICType['cType']['hash']) {
    // remove maybe opened Task modal
    PersistentStore.store.dispatch(
      UiState.Store.updateCurrentTaskAction({
        objective: undefined,
        props: undefined,
      })
    )
    this.props.history.push(`/claim/new/${cTypeHash}`)
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]) {
    const { claims } = this.state
    const _selectedOptions: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.value)

    const selectedClaims: Claims.Entry[] = claims.filter(
      (claim: Claims.Entry) => _selectedOptions.indexOf(claim.id) !== -1
    )
    const { onChange } = this.props
    if (onChange) {
      onChange(selectedClaims)
    }
  }
}

export default withRouter(SelectClaims)
