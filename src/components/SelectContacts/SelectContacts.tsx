import isEqual from 'lodash/isEqual'
import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import ContactRepository from '../../services/ContactRepository'
import * as Contacts from '../../state/ducks/Contacts'
import PersistentStore from '../../state/PersistentStore'
import { IContact } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

type SelectOption = {
  baseValue: string
  label: ReactNode
  value: string
}

type Props = {
  closeMenuOnSelect?: boolean
  contacts?: IContact[]
  isMulti?: boolean
  name?: string
  placeholder?: string
  preSelectedAddresses?: Array<IContact['publicIdentity']['address']>

  onChange?: (selectedContacts: IContact[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {
  contacts: IContact[]
  preSelectedContacts: IContact[]

  value?: null
}

class SelectContacts extends React.Component<Props, State> {
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
      contacts: props.contacts || [],
      preSelectedContacts: [],
    }

    this.onChange = this.onChange.bind(this)
  }

  public componentDidMount(): void {
    const { contacts } = this.state

    if (!contacts.length) {
      this.setState(
        {
          contacts: Contacts.getMyContacts(PersistentStore.store.getState()),
        },
        () => {
          this.initPreSelection()
        }
      )
    } else {
      this.initPreSelection()
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    const { contacts, preSelectedAddresses } = this.props
    if (
      !isEqual(prevProps.contacts, contacts) ||
      !isEqual(prevProps.preSelectedAddresses, preSelectedAddresses)
    ) {
      this.initPreSelection()
    }
  }

  private static getOption(contact: IContact): SelectOption {
    return {
      baseValue: contact.publicIdentity.address,
      label: <ContactPresentation address={contact.publicIdentity.address} />,
      value: `${contact.metaData.name} ${contact.publicIdentity.address}`,
    }
  }

  private onChange(selectedOptions: SelectOption | SelectOption[]): void {
    const { onChange } = this.props
    const { contacts } = this.state

    this.setState({
      value: undefined,
    })

    // normalize selectedOptions to Array
    const selectedOptionValues: Array<SelectOption['value']> = (Array.isArray(
      selectedOptions
    )
      ? selectedOptions
      : [selectedOptions]
    ).map((selectedOption: SelectOption) => selectedOption.baseValue)

    const selectedContacts: IContact[] = contacts.filter((contact: IContact) =>
      selectedOptionValues.includes(contact.publicIdentity.address)
    )

    if (onChange) {
      onChange(selectedContacts)
    }
  }

  public reset(): void {
    this.setState({
      value: null,
    })
  }

  private initPreSelection(): Promise<void> | null {
    const { preSelectedAddresses, onChange } = this.props
    const { contacts } = this.state

    if (!preSelectedAddresses || !preSelectedAddresses.length) {
      return null
    }

    const arrayOfPromises = preSelectedAddresses.map(
      (selectedAddress: IContact['publicIdentity']['address']) => {
        return ContactRepository.findByAddress(selectedAddress)
      }
    )

    return Promise.any(arrayOfPromises)
      .then(result => {
        return result.successes
      })
      .then((preSelectedContacts: IContact[]) => {
        this.setState({ preSelectedContacts }, () => {
          if (onChange) {
            onChange(preSelectedContacts)
          }
        })
        // add preSelected contacts to pool if not already contained
        this.setState({
          contacts: [
            ...preSelectedContacts.filter(
              (preSelectedContact: IContact) =>
                !contacts.find(
                  (contact: IContact) =>
                    contact.publicIdentity.address ===
                    preSelectedContact.publicIdentity.address
                )
            ),
            ...contacts,
          ],
        })
      })
  }

  public render(): JSX.Element {
    const {
      closeMenuOnSelect,
      isMulti,
      name,
      placeholder,
      preSelectedAddresses,

      onMenuOpen,
      onMenuClose,
    } = this.props
    const { contacts, preSelectedContacts, value } = this.state

    const options: SelectOption[] = contacts.map(contact =>
      SelectContacts.getOption(contact)
    )

    const waitForPreSelection =
      !!preSelectedAddresses && !!preSelectedAddresses.length
    const defaultOptions = options.filter((option: SelectOption) =>
      preSelectedContacts.find(
        (c: IContact) => c.publicIdentity.address === option.baseValue
      )
    )

    const fallbackPlaceholder = `Select contact${isMulti ? 's' : ''}…`

    return !!contacts &&
      !!contacts.length &&
      (!waitForPreSelection ||
        (waitForPreSelection && defaultOptions.length)) ? (
      <Select
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable={isMulti && contacts.length > 1}
        isSearchable
        isMulti={isMulti && contacts.length > 1}
        closeMenuOnSelect={closeMenuOnSelect}
        name={name}
        options={options}
        defaultValue={defaultOptions}
        value={value}
        onChange={this.onChange}
        onMenuOpen={onMenuOpen}
        onMenuClose={onMenuClose}
        placeholder={placeholder || fallbackPlaceholder}
        filterOption={createFilter(this.filterConfig)}
      />
    ) : (
      <div>
        No favorized contacts found. You need to favorize some in{' '}
        <Link to="/contacts">Contacts</Link> first.
      </div>
    )
  }
}

export default SelectContacts
