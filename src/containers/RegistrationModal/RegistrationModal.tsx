import React from 'react'
import Modal, { ModalType } from '../../components/Modal/Modal'
import './RegistrationModal.scss'

type Props = {
  showOnInit: boolean
  onClose: () => void
}

const RegistrationModal: React.FC<Props> = ({ showOnInit, onClose }) => {
  const submit = (): void => {
    console.log('submit')
  }

  return (
    <section className="RegistrationModal">
      <Modal
        className="small"
        showOnInit={showOnInit}
        type={ModalType.BLANK}
        header="Registration"
        onCancel={onClose}
      >
        <form>
          <label>
            Username:
            <input />
          </label>
          <label>
            Password:
            <input type="password" />
          </label>
          <label>
            Re-Enter Password:
            <input type="password" />
          </label>
          <button type="button" onClick={submit}>
            Create account
          </button>
        </form>
      </Modal>
    </section>
  )
}

export default RegistrationModal
