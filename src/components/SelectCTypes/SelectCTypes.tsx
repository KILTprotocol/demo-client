import * as React from 'react'
import { ReactNode } from 'react'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import { ICType } from '../../types/Ctype'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

type SelectOption = {
  baseValue: string
  label: ReactNode
  value: string
}

type Props = {
  closeMenuOnSelect?: boolean
  cTypes: ICType[]
  isMulti?: boolean
  name: string
  onChange?: (selectedCTypes: ICType[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
  placeholder?: string
}

type State = {}

class SelectCTypes extends React.Component<Props, State> {
  public static defaultProps = {
    closeMenuOnSelect: true,
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
    const {
      closeMenuOnSelect,
      cTypes,
      isMulti,
      name,
      onMenuOpen,
      onMenuClose,
      placeholder,
    } = this.props

    const options: SelectOption[] = cTypes.map(
      (cType: ICType): SelectOption => ({
        baseValue: `${cType.cType.hash}`,
        label: <CTypePresentation cType={cType} linked={false} />,
        value: `${cType.cType.metadata.title.default} ${cType.cType.hash}`,
      })
    )

    const _placeholder = `Select cType${isMulti ? 's' : ''}…`

    return (
      !!cTypes &&
      !!cTypes.length && (
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
          isClearable={isMulti && cTypes.length > 1}
          isSearchable={true}
          isMulti={isMulti && cTypes.length > 1}
          closeMenuOnSelect={closeMenuOnSelect}
          name={name}
          options={options}
          onChange={this.onChange}
          onMenuOpen={onMenuOpen}
          onMenuClose={onMenuClose}
          placeholder={placeholder || _placeholder}
          filterOption={createFilter(this.filterConfig)}
        />
      )
    )
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]) {
    const { cTypes, onChange } = this.props

    // normalize selectedOptions to Array
    const _selectedOptions: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.baseValue)

    const selectedCTypes: ICType[] = cTypes.filter(
      (cType: ICType) => _selectedOptions.indexOf(`${cType.cType.hash}`) !== -1
    )

    if (onChange) {
      onChange(selectedCTypes)
    }
  }
}

export default SelectCTypes
