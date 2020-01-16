import * as React from 'react'
import { ReactNode } from 'react'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'
import CTypeRepository from '../../services/CtypeRepository'
import ErrorService from '../../services/ErrorService'

import { ICType, CTypeWithMetadata } from '../../types/Ctype'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

type SelectOption = {
  baseValue: string
  label: ReactNode
  value: string
}

type Props = {
  closeMenuOnSelect?: boolean
  cTypes?: CTypeWithMetadata[]
  isMulti?: boolean
  name?: string
  placeholder?: string
  preSelectedCTypeHashes?: Array<ICType['cType']['hash'] | undefined>

  onChange?: (selectedCTypes: CTypeWithMetadata[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {
  cTypes: CTypeWithMetadata[]
}

class SelectCTypes extends React.Component<Props, State> {
  public static defaultProps = {
    closeMenuOnSelect: true,
    isMulti: false,
    name: 'selectCTypes',
    placeholder: `Select cType#{multi}…`,
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
      cTypes: props.cTypes || [],
    }

    this.onChange = this.onChange.bind(this)
  }

  public componentDidMount() {
    const { cTypes } = this.state

    if (!cTypes.length) {
      CTypeRepository.findAll()
        .then((fetchedCTypes: CTypeWithMetadata[]) => {
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

  public render() {
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
    const _preSelectedCTypeHashes = (preSelectedCTypeHashes || []).filter(
      (cTypeHash: ICType['cType']['hash'] | undefined) => cTypeHash
    )

    const options: SelectOption[] = cTypes.map(
      (cType: CTypeWithMetadata): SelectOption => this.getOption(cType)
    )

    const defaultOptions = options.filter(
      (option: SelectOption) =>
        _preSelectedCTypeHashes.indexOf(option.baseValue) !== -1
    )

    return (
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
          defaultValue={defaultOptions}
          placeholder={placeholder!.replace('#{multi}', isMulti ? 's' : '')}
          filterOption={createFilter(this.filterConfig)}
          onChange={this.onChange}
          onMenuOpen={onMenuOpen}
          onMenuClose={onMenuClose}
        />
      )
    )
  }

  private getOption(cType: CTypeWithMetadata): SelectOption {
    return {
      baseValue: `${cType.cType.hash}`,
      label: <CTypePresentation cTypeHash={cType.cType.hash} />,
      value: `${cType.metaData.metadata.title.default} ${cType.cType.hash}`,
    }
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]) {
    const { onChange } = this.props
    const { cTypes } = this.state

    // normalize selectedOptions to Array
    const _selectedOptions: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.baseValue)

    const selectedCTypes: CTypeWithMetadata[] = cTypes.filter(
      (cType: CTypeWithMetadata) =>
        _selectedOptions.indexOf(`${cType.cType.hash}`) !== -1
    )

    if (onChange) {
      onChange(selectedCTypes)
    }
  }

  private initPreSelection() {
    const { preSelectedCTypeHashes, onChange } = this.props
    const { cTypes } = this.state

    if (preSelectedCTypeHashes && preSelectedCTypeHashes.length && onChange) {
      onChange(
        cTypes.filter(
          (cType: CTypeWithMetadata) =>
            preSelectedCTypeHashes.indexOf(cType.cType.hash) !== -1
        )
      )
    }
  }
}

export default SelectCTypes
