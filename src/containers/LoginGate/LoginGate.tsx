import React, { useState } from 'react'
import Modal, { ModalType } from '../../components/Modal/Modal'
import logo from '../../assets/kilt_negative.svg'

import Login from '../../components/Login/Login'
import Register from '../../components/Register/Register'
import { PersistentStore } from '../../state/PersistentStore'
import PasswordContext from '../../utils/PasswordContext/PasswordContext'

import './LoginGate.scss'

const LoginGate: React.FC = ({ children }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const register = async (newPassword: string): Promise<void> => {
    PersistentStore.createSalt()
    await PersistentStore.createLocalState(newPassword)
    return setPassword(newPassword)
  }

  const login = async (newPassword: string): Promise<void> => {
    if (!newPassword) {
      setErrorMessage('Please, enter a password')
      return setError(true)
    }
    const decrypted = await PersistentStore.decrypt(newPassword)
    if (!decrypted) {
      setErrorMessage('Password does not match')
      return setError(true)
    }
    return setPassword(newPassword)
  }

  const clear = (): void => {
    PersistentStore.clearLocalStorage()
    setErrorMessage('')
    setError(false)
    setPassword('')
  }

  if (!password) {
    const state = PersistentStore.getLocalState()
    const salt = PersistentStore.getLocalSalt()

    if (!state || !salt) {
      return (
        <section className="LoginGate">
          <div className="container">
            <div className="header">
              <div className="logo-id">
                <img src={logo} alt="logo" />
              </div>
            </div>
            <h1>Client Login</h1>
            <Register submit={register} />
          </div>
        </section>
      )
    }

    return (
      <section className="LoginGate">
        <div className="container">
          <div className="header">
            <div className="logo-id">
              <img src={logo} alt="logo" />
            </div>
          </div>
          <h1>Client Login</h1>
          <Login submit={login} />
          {error && (
            <Modal
              type={ModalType.BLANK}
              header="Error"
              showOnInit
              className="small"
              onCancel={() => setError(false)}
            >
              <p>{errorMessage}</p>
              <p>Forgotten your password?</p>
              <div className="centerDiv">
                <button type="button" onClick={clear} className="clear">
                  Clear Storage
                </button>
              </div>
            </Modal>
          )}
        </div>
      </section>
    )
  }
  return (
    <PasswordContext.Provider value={password}>
      {children}
    </PasswordContext.Provider>
  )
}

export default LoginGate
