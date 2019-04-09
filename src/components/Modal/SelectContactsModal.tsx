import * as React from 'react'
import { ReactNode } from 'react'

import { Contact } from '../../types/Contact'
import SelectContacts from '../SelectContacts/SelectContacts'
import Modal, { ModalType } from './Modal'

type Props = {
  allContacts?: boolean
  closeMenuOnSelect?: boolean
  contacts?: Contact[]
  header?: string | ReactNode
  isMulti?: boolean
  name?: string
  placeholder?: string

  onCancel: () => void
  onConfirm: (selectedContacts: Contact[]) => void
}

type State = {
  isSelectContactsOpen: boolean
  selectedContacts: Contact[]
}

class SelectContactsModal extends React.Component<Props, State> {
  private static defaultProps: Partial<Props> = {
    closeMenuOnSelect: true,
    isMulti: true,
    name: 'selectContacts',
    placeholder: `Select contact#{multi}…`,
  }

  private modal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      isSelectContactsOpen: false,
      selectedContacts: [],
    }
    this.onSelectContacts = this.onSelectContacts.bind(this)
  }

  public render() {
    const {
      allContacts,
      closeMenuOnSelect,
      contacts,
      header,
      isMulti,
      name,
      placeholder,

      onCancel,
      onConfirm,
    } = this.props
    const { isSelectContactsOpen, selectedContacts } = this.state

    const finalPlaceholder = (placeholder as string).replace(
      '#{multi}',
      isMulti ? 's' : ''
    )

    let finalHeader: string | ReactNode
    if (header == null) {
      finalHeader = finalPlaceholder
    } else if (typeof header === 'string') {
      finalHeader = header.replace('#{multi}', isMulti ? 's' : '')
    } else {
      finalHeader = header
    }

    return (
      <Modal
        ref={el => {
          this.modal = el
        }}
        className="small"
        type={ModalType.CONFIRM}
        header={finalHeader}
        onCancel={onCancel}
        onConfirm={onConfirm.bind(this, selectedContacts)}
        catchBackdropClick={isSelectContactsOpen}
      >
        <div>
          <SelectContacts
            allContacts={allContacts}
            contacts={contacts as Contact[]}
            name={name as string}
            isMulti={isMulti}
            closeMenuOnSelect={closeMenuOnSelect}
            onChange={this.onSelectContacts}
            onMenuOpen={this.setSelectContactsOpen(true)}
            onMenuClose={this.setSelectContactsOpen(false, 500)}
            placeholder={finalPlaceholder}
          />
        </div>
      </Modal>
    )
  }

  public show() {
    if (this.modal) {
      this.modal.show()
    }
  }

  public hide() {
    if (this.modal) {
      this.modal.hide()
    }
  }

  private onSelectContacts(selectedContacts: Contact[]) {
    this.setState({ selectedContacts })
  }

  private setSelectContactsOpen = (
    isSelectContactsOpen: boolean,
    delay = 0
  ) => () => {
    setTimeout(() => {
      this.setState({ isSelectContactsOpen })
    }, delay)
  }
}

export default SelectContactsModal
