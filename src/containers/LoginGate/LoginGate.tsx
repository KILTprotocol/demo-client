import React, { useState } from 'react'

import Login from '../Login/Login'
import Register from '../Register/Register'
import { PersistentStore } from '../../state/PersistentStore'
import PasswordContext from '../../utils/PasswordContext/PasswordContext'

const LoginGate: React.FC = ({ children }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const register = async (newPassword: string): Promise<void> => {
    PersistentStore.createSalt()
    await PersistentStore.createLocalState(newPassword)
    setPassword(newPassword)
  }

  const login = async (newPassword: string): Promise<void> => {
    const decrypted = await PersistentStore.decrypt(newPassword)
    if (!decrypted) return setError(true)
    return setPassword(newPassword)
  }

  const clear = (): void => {
    PersistentStore.clearLocalStorage()
    setError(false)
    setPassword('')
  }

  if (!password) {
    const state = PersistentStore.getLocalState()
    const salt = PersistentStore.getLocalSalt()

    if (!state || !salt) {
      return <Register submit={register} />
    }

    return (
      <>
        <Login submit={login} />
        {error && (
          <div>
            Password wrong
            <button type="button" onClick={clear}>
              Clear Storage
            </button>
          </div>
        )}
      </>
    )
  }
  return (
    <PasswordContext.Provider value={password}>
      {children}
    </PasswordContext.Provider>
  )
}

export default LoginGate
