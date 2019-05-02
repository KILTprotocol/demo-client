import isEqual from 'lodash/isEqual'
import * as React from 'react'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import * as Delegations from '../../state/ducks/Delegations'
import { DelegationType, MyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

type SelectOption = {
  baseValue: string
  label: ReactNode
  value: string
}

type Props = {
  closeMenuOnSelect?: boolean
  delegations?: MyDelegation[]
  defaultValues?: MyDelegation[]
  isMulti?: boolean
  name?: string
  placeholder?: string
  type?: DelegationType
  filter?: (delegation: MyDelegation) => boolean

  onChange?: (selectedDelegations: MyDelegation[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {
  delegations: MyDelegation[]
}

class SelectDelegations extends React.Component<Props, State> {
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
    this.state = {
      delegations: [],
    }

    this.onChange = this.onChange.bind(this)
  }

  public componentDidMount() {
    this.setDelegations()
  }

  public componentDidUpdate(prevProps: Props) {
    if (!isEqual(prevProps.delegations, this.props.delegations)) {
      this.setDelegations()
    }
  }

  public render() {
    const {
      closeMenuOnSelect,
      defaultValues,
      isMulti,
      name,
      placeholder,

      onMenuOpen,
      onMenuClose,
    } = this.props
    const { delegations } = this.state

    const options: SelectOption[] = delegations.map(delegation =>
      this.getOption(delegation)
    )

    let defaultOptions: SelectOption[] = []
    if (defaultValues) {
      defaultOptions = defaultValues.map(delegation =>
        this.getOption(delegation)
      )
    }

    const _placeholder = `Select delegation${isMulti ? 's' : ''}…`

    return !!delegations && !!delegations.length ? (
      <Select
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable={isMulti && delegations.length > 1}
        isSearchable={true}
        isMulti={isMulti && delegations.length > 1}
        closeMenuOnSelect={closeMenuOnSelect}
        name={name}
        options={options}
        defaultValue={defaultOptions}
        onChange={this.onChange}
        onMenuOpen={onMenuOpen}
        onMenuClose={onMenuClose}
        placeholder={placeholder || _placeholder}
        filterOption={createFilter(this.filterConfig)}
      />
    ) : (
      <div>No eligible delegations found.</div>
    )
  }

  private setDelegations() {
    const { filter } = this.props
    const { delegations } = this.props

    let _delegations = delegations
    if (!_delegations) {
      const { type } = this.props

      switch (type) {
        case DelegationType.Root:
          _delegations = Delegations.getRootDelegations(
            PersistentStore.store.getState()
          )
          break
        case DelegationType.Node:
          _delegations = Delegations.getDelegations(
            PersistentStore.store.getState()
          )
          break
        default:
          _delegations = Delegations.getAllDelegations(
            PersistentStore.store.getState()
          )
      }

      if (filter) {
        _delegations = _delegations.filter((delegation: MyDelegation) =>
          filter(delegation)
        )
      }
    }

    this.setState({
      delegations: _delegations,
    })
  }

  private getOption(delegation: MyDelegation): SelectOption {
    // TODO: refactor when sdk can resolve root Node to a given node
    const cTypeHash = delegation.cTypeHash
    return {
      baseValue: delegation.id,
      label: (
        <span>
          {delegation.metaData.alias}
          <CTypePresentation cTypeHash={cTypeHash} inline={true} />
        </span>
      ),
      value: `${delegation.metaData.alias} ${delegation.id}`,
    }
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]) {
    const { onChange } = this.props
    const { delegations } = this.state

    // normalize selectedOptions to Array
    const _selectedOptions: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.baseValue)

    const selectedDelegations: MyDelegation[] = delegations.filter(
      (delegation: MyDelegation) =>
        _selectedOptions.indexOf(delegation.id) !== -1
    )

    if (onChange) {
      onChange(selectedDelegations)
    }
  }
}

export default SelectDelegations
