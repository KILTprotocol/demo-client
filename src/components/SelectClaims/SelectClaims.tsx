import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { ReactNode } from 'react'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import * as Claims from '../../state/ducks/Claims'

type SelectOption = {
  label: ReactNode
  value: string
}

type Props = {
  closeMenuOnSelect?: boolean
  claims: Claims.Entry[]
  isMulti?: boolean
  placeholder?: string
  onChange?: (selectedClaims: Claims.Entry[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {}

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

    this.onChange = this.onChange.bind(this)
  }

  public render() {
    const {
      closeMenuOnSelect,
      claims,
      isMulti,
      onMenuOpen,
      onMenuClose,
      placeholder,
    } = this.props

    const options: SelectOption[] = claims.map(
      (claim: Claims.Entry): SelectOption => {
        const isApproved =
          claim.attestations &&
          claim.attestations.find(
            (attestedClaim: sdk.IAttestedClaim) =>
              !attestedClaim.attestation.revoked
          )
        return {
          label: (
            <span className={isApproved ? 'attested' : 'revoked'}>
              {claim.meta.alias}
            </span>
          ),
          value: claim.id,
        }
      }
    )

    return (
      !!claims &&
      !!claims.length && (
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
          isClearable={isMulti && claims.length > 1}
          isSearchable={false}
          isMulti={isMulti && claims.length > 1}
          closeMenuOnSelect={closeMenuOnSelect}
          name="selectClaims"
          options={options}
          onChange={this.onChange}
          onMenuOpen={onMenuOpen}
          onMenuClose={onMenuClose}
          placeholder={placeholder || `Select claim${isMulti ? 's' : ''}…`}
          filterOption={createFilter(this.filterConfig)}
        />
      )
    )
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]) {
    const { claims } = this.props
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

export default SelectClaims
