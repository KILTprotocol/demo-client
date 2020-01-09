import * as React from 'react'
import { ReactNode } from 'react'
import Select from 'react-select'
import CTypeRepository from '../../services/CtypeRepository'

import ErrorService from '../../services/ErrorService'
import { CTypeWithMetadata } from '../../types/Ctype'
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
  onConfirm: (selectedCTypes: CTypeWithMetadata[]) => void
}

type State = {
  cTypes?: CTypeWithMetadata[]
  isSelectCTypesOpen: boolean
  selectedCTypes: CTypeWithMetadata[]
}

class SelectCTypesModal extends React.Component<Props, State> {
  public static defaultProps = {
    placeholder: `Select cType#{multi}`,
  }

  private modal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      isSelectCTypesOpen: false,
      selectedCTypes: [],
    }
    this.onSelectCTypes = this.onSelectCTypes.bind(this)
  }

  public render() {
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
        onConfirm={onConfirm.bind(this, selectedCTypes)}
      >
        <div>
          <SelectCTypes
            cTypes={cTypes as CTypeWithMetadata[]}
            name={name as string}
            isMulti={isMulti}
            closeMenuOnSelect={closeMenuOnSelect}
            onChange={this.onSelectCTypes}
            onMenuOpen={this.setSelectCTypesOpen(true)}
            onMenuClose={this.setSelectCTypesOpen(false, 500)}
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

  private onSelectCTypes(selectedCTypes: CTypeWithMetadata[]) {
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
}

export default SelectCTypesModal
