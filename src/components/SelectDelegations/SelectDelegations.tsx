import * as React from 'react'
import { ReactNode } from 'react'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation, MyRootDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

type SelectOption = {
  baseValue: string
  label: ReactNode
  value: string
}

type Props = {
  closeMenuOnSelect?: boolean
  delegations?: Array<MyDelegation | MyRootDelegation>
  defaultValues?: Array<MyDelegation | MyRootDelegation>
  isMulti?: boolean
  name?: string
  placeholder?: string

  onChange?: (
    selectedDelegations: Array<MyDelegation | MyRootDelegation>
  ) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {
  delegations: Array<MyDelegation | MyRootDelegation>
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
      delegations: props.delegations || [],
    }

    this.onChange = this.onChange.bind(this)
  }

  public componentDidMount() {
    const { delegations } = this.state

    if (!delegations.length) {
      this.setState({
        delegations: Delegations.getDelegations(
          PersistentStore.store.getState()
        ),
      })
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

    return (
      !!delegations &&
      !!delegations.length && (
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
      )
    )
  }

  private getOption(delegation: MyDelegation | MyRootDelegation): SelectOption {
    // TODO: refactor when sdk can resolve root Node to a given node
    const cTypeHash = (delegation as MyRootDelegation).cTypeHash
    return {
      baseValue: delegation.id,
      label: (
        <span>
          {delegation.metaData.alias}
          <CTypePresentation
            cTypeHash={cTypeHash}
            inline={true}
            linked={false}
          />
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

    const selectedDelegations: Array<
      MyDelegation | MyRootDelegation
    > = delegations.filter(
      (delegation: MyDelegation | MyRootDelegation) =>
        _selectedOptions.indexOf(delegation.id) !== -1
    )

    if (onChange) {
      onChange(selectedDelegations)
    }
  }
}

export default SelectDelegations
