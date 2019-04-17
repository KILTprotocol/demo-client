import * as React from 'react'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import ContactRepository from '../../services/ContactRepository'
import * as Contacts from '../../state/ducks/Contacts'
import PersistentStore from '../../state/PersistentStore'
import { Contact } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

type SelectOption = {
  baseValue: string
  label: ReactNode
  value: string
}

type Props = {
  allContacts?: boolean
  closeMenuOnSelect?: boolean
  contacts?: Contact[]
  isMulti?: boolean
  name?: string
  placeholder?: string
  preSelectedAddresses?: Array<Contact['publicIdentity']['address']>

  onChange?: (selectedContacts: Contact[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {
  contacts: Contact[]
}

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
    this.state = {
      contacts: props.contacts || [],
    }

    this.onChange = this.onChange.bind(this)
  }

  public componentDidMount() {
    const { allContacts } = this.props
    const { contacts } = this.state

    if (!contacts.length) {
      if (allContacts) {
        ContactRepository.findAll().then(_contacts => {
          this.setState({ contacts: _contacts }, () => {
            this.initPreSelection()
          })
        })
      } else {
        this.setState(
          {
            contacts: Contacts.getMyContacts(PersistentStore.store.getState()),
          },
          () => {
            this.initPreSelection()
          }
        )
      }
    } else {
      this.initPreSelection()
    }
  }

  public render() {
    const {
      closeMenuOnSelect,
      isMulti,
      name,
      placeholder,
      preSelectedAddresses,

      onMenuOpen,
      onMenuClose,
    } = this.props
    const { contacts } = this.state

    const options: SelectOption[] = contacts.map(contact =>
      this.getOption(contact)
    )

    let defaultOptions: SelectOption[] = []
    if (preSelectedAddresses) {
      defaultOptions = options.filter(
        (option: SelectOption) =>
          preSelectedAddresses.indexOf(option.baseValue) !== -1
      )
    }

    const _placeholder = `Select contact${isMulti ? 's' : ''}…`

    return !!contacts && !!contacts.length ? (
      <Select
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable={isMulti && contacts.length > 1}
        isSearchable={true}
        isMulti={isMulti && contacts.length > 1}
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
      <div>
        No favorized contacts found. You need to favorize some in{' '}
        <Link to="/contacts">Contacts</Link> first.
      </div>
    )
  }

  private getOption(contact: Contact): SelectOption {
    return {
      baseValue: contact.publicIdentity.address,
      label: <ContactPresentation address={contact.publicIdentity.address} />,
      value: `${contact.metaData.name} ${contact.publicIdentity.address}`,
    }
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]) {
    const { onChange } = this.props
    const { contacts } = this.state

    // normalize selectedOptions to Array
    const _selectedOptions: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.baseValue)

    const selectedContacts: Contact[] = contacts.filter(
      (contact: Contact) =>
        _selectedOptions.indexOf(contact.publicIdentity.address) !== -1
    )

    if (onChange) {
      onChange(selectedContacts)
    }
  }

  private initPreSelection() {
    const { preSelectedAddresses, onChange } = this.props
    const { contacts } = this.state

    if (preSelectedAddresses && preSelectedAddresses.length && onChange) {
      onChange(
        contacts.filter(
          (contact: Contact) =>
            preSelectedAddresses.indexOf(contact.publicIdentity.address) !== -1
        )
      )
    }
  }
}

export default SelectContacts
