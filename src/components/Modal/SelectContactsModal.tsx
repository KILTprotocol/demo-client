import React, { ReactNode } from 'react'

import { IContact } from '../../types/Contact'
import SelectContacts from '../SelectContacts/SelectContacts'
import Modal, { ModalType } from './Modal'

type Props = {
  closeMenuOnSelect?: boolean
  contacts?: IContact[]
  header?: string | ReactNode
  isMulti?: boolean
  name?: string
  placeholder?: string

  onCancel: () => void
  onConfirm: (selectedContacts: IContact[]) => void
}

type State = {
  isSelectContactsOpen: boolean
  selectedContacts: IContact[]
}

class SelectContactsModal extends React.Component<Props, State> {
  private modal: Modal | null

  public static defaultProps: Partial<Props> = {
    closeMenuOnSelect: true,
    isMulti: true,
    name: 'selectContacts',
    placeholder: `Select contact#{multi}…`,
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      isSelectContactsOpen: false,
      selectedContacts: [],
    }
    this.onSelectContacts = this.onSelectContacts.bind(this)
  }

  private onSelectContacts(selectedContacts: IContact[]): void {
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

  public show(): void {
    if (this.modal) {
      this.modal.show()
    }
  }

  public hide(): void {
    if (this.modal) {
      this.modal.hide()
    }
  }

  public render(): JSX.Element {
    const {
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
        onConfirm={() => onConfirm(selectedContacts)}
        catchBackdropClick={isSelectContactsOpen}
      >
        <div>
          <SelectContacts
            contacts={contacts as IContact[]}
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
}

export default SelectContactsModal
