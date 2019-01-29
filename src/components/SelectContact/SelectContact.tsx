import { ReactNode } from 'react'
import * as React from 'react'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import { Contact } from '../../types/Contact'
import KiltIdenticon from '../KiltIdenticon/KiltIdenticon'

type SelectOption = {
  label: ReactNode
  value: string
}

type Props = {
  contacts: Contact[]
  isMulti?: boolean
  name: string
  onChange?: (selectedContacts: Contact[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
  placeholder?: string
}

type State = {}

class SelectContacts extends React.Component<Props, State> {
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
    const {
      contacts,
      isMulti,
      name,
      onMenuOpen,
      onMenuClose,
      placeholder,
    } = this.props

    const options: SelectOption[] = contacts.map(
      (contact: Contact): SelectOption => ({
        label: <KiltIdenticon contact={contact} size={24} />,
        value: contact.publicIdentity.address,
      })
    )

    const _placeholder = `Select contact${isMulti ? 's' : ''}…`

    return (
      !!contacts &&
      !!contacts.length && (
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
          isClearable={isMulti}
          isSearchable={true}
          isMulti={isMulti}
          closeMenuOnSelect={!isMulti}
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
    const { contacts } = this.props
    const _selectedOptions: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.value)

    const selectedContacts: Contact[] = contacts.filter(
      (contact: Contact) =>
        _selectedOptions.indexOf(contact.publicIdentity.address) !== -1
    )
    const { onChange } = this.props
    if (onChange) {
      onChange(selectedContacts)
    }
  }
}

export default SelectContacts
