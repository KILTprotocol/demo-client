import * as React from 'react'

import contactRepository from '../../services/ContactRepository'
import { Contact } from '../../types/Contact'
import { CType } from '../../types/Ctype'
import SelectContacts from '../SelectContact/SelectContact'

type Props = {
  closeMenuOnSelect?: boolean
  isMulti?: boolean
  ctypes?: CType[]
  onChange?: (selectedAttesters: Contact[]) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

type State = {
  attesters: Contact[]
}

class SelectAttesters extends React.Component<Props, State> {
  public static defaultProps = {
    closeMenuOnSelect: true,
    isMulti: true,
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      attesters: [],
    }
  }

  public componentDidMount() {
    contactRepository.findAll().then((attesters: Contact[]) => {
      // TODO: filter by ctype when info available
      this.setState({ attesters })
    })
  }

  public render() {
    const {
      closeMenuOnSelect,
      isMulti,
      onChange,
      onMenuOpen,
      onMenuClose,
    } = this.props
    const { attesters } = this.state
    return (
      !!attesters &&
      !!attesters.length && (
        <SelectContacts
          contacts={attesters}
          name="selectAttesters"
          isMulti={isMulti}
          onChange={onChange}
          onMenuOpen={onMenuOpen}
          onMenuClose={onMenuClose}
          closeMenuOnSelect={closeMenuOnSelect}
          placeholder={`Select attester${isMulti ? 's' : ''}…`}
        />
      )
    )
  }
}

export default SelectAttesters
