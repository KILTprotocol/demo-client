import React, { useState } from 'react'
import Modal, { ModalType } from '../../components/Modal/Modal'
import './RegistrationModal.scss'

type Props = {
  showOnInit: boolean
  onClose: () => void
}

const RegistrationModal: React.FC<Props> = ({ showOnInit, onClose }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordChecker, setPasswordChecker] = useState('')

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
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          <label>
            Re-Enter Password:
            <input
              value={passwordChecker}
              type="password"
              onChange={e => setPasswordChecker(e.target.value)}
            />
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
