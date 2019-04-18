import isEqual from 'lodash/isEqual'
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
  preSelectedContacts: Contact[]
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
      preSelectedContacts: [],
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

  public componentDidUpdate(prevProps: Props) {
    if (
      !isEqual(prevProps.contacts, this.props.contacts) ||
      !isEqual(prevProps.preSelectedAddresses, this.props.preSelectedAddresses)
    ) {
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
    const { contacts, preSelectedContacts } = this.state

    const options: SelectOption[] = contacts.map(contact =>
      this.getOption(contact)
    )

    const waitForPreSelection =
      !!preSelectedAddresses && !!preSelectedAddresses.length
    const defaultOptions = options.filter((option: SelectOption) =>
      preSelectedContacts.find(
        (c: Contact) => c.publicIdentity.address === option.baseValue
      )
    )

    const _placeholder = `Select contact${isMulti ? 's' : ''}…`

    return !!contacts &&
      !!contacts.length &&
      (!waitForPreSelection ||
        (waitForPreSelection && defaultOptions.length)) ? (
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

  private async initPreSelection() {
    const { preSelectedAddresses, onChange } = this.props
    const { contacts } = this.state

    if (!preSelectedAddresses || !preSelectedAddresses.length) {
      return
    }

    const arrayOfPromises = preSelectedAddresses.map(
      (selectedAddress: Contact['publicIdentity']['address']) => {
        return ContactRepository.findByAddress(selectedAddress)
      }
    )

    return Promise.all(arrayOfPromises)
      .catch(() => {
        return arrayOfPromises
      })
      .then((preSelectedContacts: Contact[]) =>
        preSelectedContacts.filter(
          (preSelectedContact: Contact) => preSelectedContact
        )
      )
      .then((preSelectedContacts: Contact[]) => {
        this.setState({ preSelectedContacts }, () => {
          if (onChange) {
            onChange(preSelectedContacts)
          }
        })
        // add preSelected contacts to pool if not already contained
        this.setState({
          contacts: [
            ...preSelectedContacts.filter(
              (preSelectedContact: Contact) =>
                !contacts.find(
                  (contact: Contact) =>
                    contact.publicIdentity.address ===
                    preSelectedContact.publicIdentity.address
                )
            ),
            ...contacts,
          ],
        })
      })
  }
}

export default SelectContacts
