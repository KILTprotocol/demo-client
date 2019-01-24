import * as React from 'react'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import * as Claims from '../../state/ducks/Claims'

type SelectOption = {
  value: string
  label: string
}

type Props = {
  claims: Claims.Entry[]
  isMulti?: boolean
  onChange?: (selectedClaims: Claims.Entry[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {}

class SelectClaims extends React.Component<Props, State> {
  public static defaultProps = {
    isMulti: false,
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
    const { claims, isMulti, onMenuOpen, onMenuClose } = this.props

    const options: SelectOption[] = claims.map(
      (claim: Claims.Entry): SelectOption => ({
        label: claim.claim.alias,
        value: claim.claim.hash,
      })
    )

    return (
      !!claims &&
      !!claims.length && (
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
          isClearable={isMulti}
          isSearchable={true}
          isMulti={isMulti}
          closeMenuOnSelect={!isMulti}
          name="selectClaims"
          options={options}
          onChange={this.onChange}
          onMenuOpen={onMenuOpen}
          onMenuClose={onMenuClose}
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
      (claim: Claims.Entry) => _selectedOptions.indexOf(claim.claim.hash) !== -1
    )
    const { onChange } = this.props
    if (onChange) {
      onChange(selectedClaims)
    }
  }
}

export default SelectClaims
