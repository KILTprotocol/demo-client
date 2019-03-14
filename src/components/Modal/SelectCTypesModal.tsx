import * as React from 'react'
import { ReactNode } from 'react'
import CTypeRepository from '../../services/CtypeRepository'

import ErrorService from '../../services/ErrorService'
import { ICType } from '../../types/Ctype'
import SelectCTypes from '../SelectCTypes/SelectCTypes'
import Modal, { ModalType } from './Modal'

type Props = {
  header?: string | ReactNode
  isMulti?: boolean
  name?: string
  placeholder?: string
  closeMenuOnSelect?: boolean
  onCancel: () => void
  onConfirm: (selectedCTypes: ICType[]) => void
}

type State = {
  cTypes?: ICType[]
  isSelectCTypesOpen: boolean
  selectedCTypes: ICType[]
}

class SelectCTypesModal extends React.Component<Props, State> {
  private static defaultProps: Partial<Props> = {
    closeMenuOnSelect: true,
    isMulti: false,
    name: 'selectCTypes',
    placeholder: `Select cType#{multi}…`,
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

  public componentDidMount() {
    CTypeRepository.findAll()
      .then((cTypes: ICType[]) => {
        this.setState({ cTypes })
      })
      .catch(error => {
        ErrorService.logWithNotification({
          error,
          message: 'Could not fetch cTypes',
          origin: 'SelectCTypesModal.componentDidMount()',
          type: 'ERROR.FETCH.GET',
        })
      })
  }

  public render() {
    const { cTypes } = this.state

    if (!!cTypes && !!cTypes.length) {
      return this.getModalElement()
    } else {
      return ''
    }
  }

  public getModalElement() {
    const {
      header,
      isMulti,
      name,
      placeholder,
      closeMenuOnSelect,
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
        type={ModalType.CONFIRM}
        header={finalHeader}
        onCancel={onCancel}
        onConfirm={onConfirm.bind(this, selectedCTypes)}
        catchBackdropClick={isSelectCTypesOpen}
      >
        <div>
          <SelectCTypes
            cTypes={cTypes as ICType[]}
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

  private onSelectCTypes(selectedCTypes: ICType[]) {
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
