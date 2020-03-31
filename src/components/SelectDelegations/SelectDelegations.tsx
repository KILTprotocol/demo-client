import React, { ReactNode } from 'react'
import isEqual from 'lodash/isEqual'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import * as Delegations from '../../state/ducks/Delegations'
import { DelegationType, IMyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

type SelectOption = {
  baseValue: string
  label: ReactNode
  value: string
}

type Props = {
  closeMenuOnSelect?: boolean
  delegations?: IMyDelegation[]
  defaultValues?: IMyDelegation[]
  isMulti?: boolean
  name?: string
  placeholder?: string
  type?: DelegationType
  filter?: (delegation: IMyDelegation) => boolean

  onChange?: (selectedDelegations: IMyDelegation[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {
  delegations: IMyDelegation[]
}

class SelectDelegations extends React.Component<Props, State> {
  private filterConfig: Config = {
    ignoreAccents: true,
    ignoreCase: true,
    matchFrom: 'any',
    trim: true,
  }

  public static defaultProps = {
    closeMenuOnSelect: true,
    isMulti: false,
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      delegations: [],
    }

    this.onChange = this.onChange.bind(this)
  }

  public componentDidMount(): void {
    this.setDelegations()
  }

  public componentDidUpdate(prevProps: Props): void {
    const { delegations } = this.props
    if (!isEqual(prevProps.delegations, delegations)) {
      this.setDelegations()
    }
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]): void {
    const { onChange } = this.props
    const { delegations } = this.state

    // normalize selectedOptions to Array
    const selectedOptionValues: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.baseValue)

    const selectedDelegations: IMyDelegation[] = delegations.filter(
      (delegation: IMyDelegation) =>
        selectedOptionValues.includes(delegation.id)
    )

    if (onChange) {
      onChange(selectedDelegations)
    }
  }

  private static getOption(delegation: IMyDelegation): SelectOption {
    // TODO: refactor when sdk can resolve root Node to a given node
    const { cTypeHash } = delegation
    return {
      baseValue: delegation.id,
      label: (
        <span>
          {delegation.metaData.alias}
          <CTypePresentation cTypeHash={cTypeHash} inline />
        </span>
      ),
      value: `${delegation.metaData.alias} ${delegation.id}`,
    }
  }

  private setDelegations(): void {
    const { filter } = this.props
    const { delegations } = this.props

    let newDelegations = delegations
    if (!newDelegations) {
      const { type } = this.props
      switch (type) {
        case DelegationType.Root:
          newDelegations = Delegations.getRootDelegations(
            PersistentStore.store.getState()
          )
          break
        case DelegationType.Node:
          newDelegations = Delegations.getDelegations(
            PersistentStore.store.getState()
          )
          break
        default:
          newDelegations = Delegations.getAllDelegations(
            PersistentStore.store.getState()
          )
      }

      if (filter) {
        newDelegations = newDelegations.filter((delegation: IMyDelegation) =>
          filter(delegation)
        )
      }
    }

    this.setState({
      delegations: newDelegations,
    })
  }

  public render(): JSX.Element {
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
      SelectDelegations.getOption(delegation)
    )

    let defaultOptions: SelectOption[] = []
    if (defaultValues) {
      defaultOptions = defaultValues.map(delegation =>
        SelectDelegations.getOption(delegation)
      )
    }

    const placeholderFallback = `Select delegation${isMulti ? 's' : ''}…`

    return !!delegations && !!delegations.length ? (
      <Select
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable={isMulti && delegations.length > 1}
        isSearchable
        isMulti={isMulti && delegations.length > 1}
        closeMenuOnSelect={closeMenuOnSelect}
        name={name}
        options={options}
        defaultValue={defaultOptions}
        onChange={this.onChange}
        onMenuOpen={onMenuOpen}
        onMenuClose={onMenuClose}
        placeholder={placeholder || placeholderFallback}
        filterOption={createFilter(this.filterConfig)}
      />
    ) : (
      <div>No eligible delegations found.</div>
    )
  }
}

export default SelectDelegations
