import * as React from 'react'

import { Contact } from '../../types/Contact'
import SelectAttesters from '../SelectAttesters/SelectAttesters'
import Modal, { ModalType } from './Modal'

type Props = {
  onCancel: () => void
  onConfirm: (selectedAttesters: Contact[]) => void
}

type State = {
  isSelectAttestersOpen: boolean
  selectedAttesters: Contact[]
}

class SelectAttestersModal extends React.Component<Props, State> {
  private modal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      isSelectAttestersOpen: false,
      selectedAttesters: [],
    }
    this.onSelectAttesters = this.onSelectAttesters.bind(this)
  }

  public render() {
    const { onCancel, onConfirm } = this.props
    const { isSelectAttestersOpen, selectedAttesters } = this.state
    return (
      <Modal
        ref={el => {
          this.modal = el
        }}
        type={ModalType.CONFIRM}
        header="Select Attester(s):"
        onCancel={onCancel}
        onConfirm={onConfirm.bind(this, selectedAttesters)}
        catchBackdropClick={isSelectAttestersOpen}
      >
        <div>
          <SelectAttesters
            onChange={this.onSelectAttesters}
            onMenuOpen={this.setSelectAttestersOpen(true)}
            onMenuClose={this.setSelectAttestersOpen(false, 500)}
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

  private onSelectAttesters(selectedAttesters: Contact[]) {
    this.setState({ selectedAttesters })
  }

  private setSelectAttestersOpen = (
    isSelectAttestersOpen: boolean,
    delay = 0
  ) => () => {
    setTimeout(() => {
      this.setState({ isSelectAttestersOpen })
    }, delay)
  }
}

export default SelectAttestersModal
