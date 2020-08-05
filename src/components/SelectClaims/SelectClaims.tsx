import React, { ReactNode } from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import * as Claims from '../../state/ducks/Claims'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'
import { ICType, ICTypeWithMetadata } from '../../types/Ctype'
import SelectCTypesModal from '../Modal/SelectCTypesModal'

type SelectOption = {
  baseValue: Claims.Entry['meta']['alias']
  label: ReactNode
  value: string
}

type Props = RouteComponentProps<{}> & {
  closeMenuOnSelect?: boolean
  claims?: Claims.Entry[]
  cTypeHash: ICType['cType']['hash'] | null
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
  private filterConfig: Config = {
    ignoreAccents: true,
    ignoreCase: true,
    matchFrom: 'any',
    trim: true,
  }

  public static defaultProps = {
    closeMenuOnSelect: true,
    isMulti: false,
    showAttested: true,
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

  public componentDidMount(): void {
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

  private static getOption(claim: Claims.Entry): SelectOption {
    {
      const isApproved =
        claim.attestedClaims &&
        claim.attestedClaims.find(({ attestation }) => !attestation.revoked)
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

  private onSelectCType(selectedCtypes: ICTypeWithMetadata[]): void {
    this.goToClaimCreate(selectedCtypes[0].cType.hash)
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]): void {
    const { claims } = this.state
    const selectedOptionValues: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.value)

    const selectedClaims: Claims.Entry[] = claims.filter(
      (claim: Claims.Entry) => selectedOptionValues.includes(claim.id)
    )
    const { onChange } = this.props
    if (onChange) {
      onChange(selectedClaims)
    }
  }

  private handleClaimCreateRequest(
    e: React.MouseEvent<HTMLAnchorElement>
  ): void {
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

  private goToClaimCreate(cTypeHash: ICType['cType']['hash']): void {
    const { history } = this.props
    // remove maybe opened Task modal
    PersistentStore.store.dispatch(
      UiState.Store.updateCurrentTaskAction({
        objective: undefined,
        props: undefined,
      })
    )
    history.push(`/claim/new/${cTypeHash}`)
  }

  public render(): JSX.Element {
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

    const defaultOptions = (
      preSelectedClaimEntries || []
    ).map((claim: Claims.Entry) => SelectClaims.getOption(claim))

    let selectedClaims
    if (claims && claims.length) {
      selectedClaims = claims
    } else if (cTypeHash) {
      selectedClaims = Claims.getClaimsByCTypeHash(
        PersistentStore.store.getState(),
        cTypeHash
      )
    } else {
      selectedClaims = Claims.getClaims(PersistentStore.store.getState())
    }

    const options: SelectOption[] = selectedClaims.map(
      (claim: Claims.Entry): SelectOption => SelectClaims.getOption(claim)
    )

    return !!selectedClaims && !!selectedClaims.length ? (
      <Select
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable={isMulti && selectedClaims.length > 1}
        isSearchable={false}
        isMulti={isMulti && selectedClaims.length > 1}
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
          <SelectCTypesModal onConfirm={this.onSelectCType} showOnInit />
        )}
      </>
    )
  }
}

export default withRouter(SelectClaims)
