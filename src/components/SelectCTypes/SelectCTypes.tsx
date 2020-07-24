import React, { ReactNode } from 'react'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'
import CTypeRepository from '../../services/CtypeRepository'
import ErrorService from '../../services/ErrorService'

import { ICType, ICTypeWithMetadata } from '../../types/Ctype'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

type SelectOption = {
  baseValue: string
  label: ReactNode
  value: string
}

type Props = {
  closeMenuOnSelect?: boolean
  cTypes?: ICTypeWithMetadata[]
  isMulti?: boolean
  name?: string
  placeholder?: string
  preSelectedCTypeHashes?: Array<ICType['cType']['hash'] | null>

  onChange?: (selectedCTypes: ICTypeWithMetadata[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {
  cTypes: ICTypeWithMetadata[]
}

class SelectCTypes extends React.Component<Props, State> {
  private filterConfig: Config = {
    ignoreAccents: true,
    ignoreCase: true,
    matchFrom: 'any',
    trim: true,
  }

  public static defaultProps = {
    closeMenuOnSelect: true,
    isMulti: false,
    name: 'selectCTypes',
    placeholder: `Select cType#{multi}…`,
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      cTypes: props.cTypes || [],
    }

    this.onChange = this.onChange.bind(this)
  }

  public componentDidMount(): void {
    const { cTypes } = this.state

    if (!cTypes.length) {
      CTypeRepository.findAll()
        .then((fetchedCTypes: ICTypeWithMetadata[]) => {
          this.setState({ cTypes: fetchedCTypes })
          this.initPreSelection()
        })
        .catch(error => {
          ErrorService.logWithNotification({
            error,
            message: 'Could not fetch cTypes',
            origin: 'SelectCTypes.componentDidMount()',
            type: 'ERROR.FETCH.GET',
          })
        })
    } else {
      this.initPreSelection()
    }
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]): void {
    const { onChange } = this.props
    const { cTypes } = this.state

    // normalize selectedOptions to Array
    const selectedOptionValues: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.baseValue)

    const selectedCTypes: ICTypeWithMetadata[] = cTypes.filter(
      (cType: ICTypeWithMetadata) =>
        selectedOptionValues.includes(cType.cType.hash)
    )

    if (onChange) {
      onChange(selectedCTypes)
    }
  }

  private static getOption(cType: ICTypeWithMetadata): SelectOption {
    return {
      baseValue: `${cType.cType.hash}`,
      label: <CTypePresentation cTypeHash={cType.cType.hash} />,
      value: `${cType.metaData.metadata.title.default} ${cType.cType.hash}`,
    }
  }

  private initPreSelection(): void {
    const { preSelectedCTypeHashes, onChange } = this.props
    const { cTypes } = this.state

    if (preSelectedCTypeHashes && preSelectedCTypeHashes.length && onChange) {
      onChange(
        cTypes.filter((cType: ICTypeWithMetadata) =>
          preSelectedCTypeHashes.includes(cType.cType.hash)
        )
      )
    }
  }

  public render(): false | JSX.Element {
    const {
      closeMenuOnSelect,
      isMulti,
      name,
      onMenuOpen,
      onMenuClose,
      placeholder,
      preSelectedCTypeHashes,
    } = this.props
    const { cTypes } = this.state
    const filteredPreSelectedCTypeHashes = (
      preSelectedCTypeHashes || []
    ).filter((cTypeHash: ICType['cType']['hash'] | null) => cTypeHash)

    const options: SelectOption[] = cTypes.map(
      (cType: ICTypeWithMetadata): SelectOption => SelectCTypes.getOption(cType)
    )

    const defaultOptions = options.filter((option: SelectOption) =>
      filteredPreSelectedCTypeHashes.includes(option.baseValue)
    )

    return (
      !!cTypes.length && (
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
          isClearable={isMulti && cTypes.length > 1}
          isSearchable
          isMulti={isMulti && cTypes.length > 1}
          closeMenuOnSelect={closeMenuOnSelect}
          name={name}
          options={options}
          defaultValue={defaultOptions}
          placeholder={
            placeholder && placeholder.replace('#{multi}', isMulti ? 's' : '')
          }
          filterOption={createFilter(this.filterConfig)}
          onChange={this.onChange}
          onMenuOpen={onMenuOpen}
          onMenuClose={onMenuClose}
        />
      )
    )
  }
}

export default SelectCTypes
