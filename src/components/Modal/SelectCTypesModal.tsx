import React, { ReactNode } from 'react'

import { ICTypeWithMetadata } from '../../types/Ctype'
import SelectCTypes from '../SelectCTypes/SelectCTypes'
import Modal, { ModalType } from './Modal'

type Props = {
  header?: string | ReactNode
  isMulti?: boolean
  name?: string
  placeholder?: string
  closeMenuOnSelect?: boolean
  showOnInit?: boolean

  onCancel?: () => void
  onConfirm: (selectedCTypes: ICTypeWithMetadata[]) => void
}

type State = {
  cTypes?: ICTypeWithMetadata[]
  isSelectCTypesOpen: boolean
  selectedCTypes: ICTypeWithMetadata[]
}

class SelectCTypesModal extends React.Component<Props, State> {
  private modal: Modal | null

  public static defaultProps = {
    placeholder: `Select cType#{multi}`,
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      isSelectCTypesOpen: false,
      selectedCTypes: [],
    }
    this.onSelectCTypes = this.onSelectCTypes.bind(this)
  }

  private onSelectCTypes(selectedCTypes: ICTypeWithMetadata[]): void {
    this.setState({ selectedCTypes })
  }

  private setSelectCTypesOpen = (
    isSelectCTypesOpen: boolean,
    delay = 0
  ) => () => {
    setTimeout(() => {
      this.setState({ isSelectCTypesOpen })
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
      header,
      isMulti,
      name,
      placeholder,
      showOnInit,

      onCancel,
      onConfirm,
    } = this.props
    const { cTypes, isSelectCTypesOpen, selectedCTypes } = this.state

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
        catchBackdropClick={isSelectCTypesOpen}
        showOnInit={showOnInit}
        onCancel={onCancel}
        onConfirm={() => onConfirm(selectedCTypes)}
      >
        <div>
          <SelectCTypes
            cTypes={cTypes as ICTypeWithMetadata[]}
            name={name as string}
            isMulti={isMulti}
            closeMenuOnSelect={closeMenuOnSelect}
            onChange={this.onSelectCTypes}
            onMenuOpen={this.setSelectCTypesOpen(true)}
            onMenuClose={this.setSelectCTypesOpen(false, 500)}
            placeholder={finalPlaceholder}
            preSelectedCTypeHashes={[null]}
          />
        </div>
      </Modal>
    )
  }
}

export default SelectCTypesModal
