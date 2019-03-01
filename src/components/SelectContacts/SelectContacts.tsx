import * as React from 'react'
import { ReactNode } from 'react'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import { Contact } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

type SelectOption = {
  label: ReactNode
  value: string
}

type Props = {
  closeMenuOnSelect?: boolean
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
      contacts,
      isMulti,
      name,
      onMenuOpen,
      onMenuClose,
      placeholder,
    } = this.props

    const options: SelectOption[] = contacts.map(
      (contact: Contact): SelectOption => ({
        label: <ContactPresentation address={contact.publicIdentity.address} />,
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
          isClearable={isMulti && contacts.length > 1}
          isSearchable={false}
          isMulti={isMulti && contacts.length > 1}
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
