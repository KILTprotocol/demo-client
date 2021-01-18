import React, { useState } from 'react'
import RegistrationModal from '../RegistrationModal/RegistrationModal'
import { notifyFailure } from '../../services/FeedbackService'

import './Login.scss'
import '../../App.scss'

const Login: React.FC = () => {
  const [registrationType, setRegistrationType] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const registration = (): void => {
    setRegistrationType(true)
  }

  const submit = (): void => {
    // This will be changed to access the localstorage. From the username and salt.
    // Will add the salt and password hashing.
    const fakePassword = 'password'
    if (password !== fakePassword) {
      notifyFailure(
        `Username Passwords do not match. Please, enter the correct password for ${username}`
      )
      throw new Error('Username Passwords do not match.')
    }
    console.log('confirmed')
  }

  const onClose = (): void => {
    setRegistrationType(false)
  }

  return (
    <section className="App">
      {!registrationType && (
        <form className="Login">
          <label>
            Username:{' '}
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Password:{' '}
            <input
              value={password}
              type="password"
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          <a type="button" className="link" onClick={registration}>
            Create new Account
          </a>
          <button type="button" className="confirm" onClick={submit}>
            Login
          </button>
        </form>
      )}
      {registrationType && (
        <RegistrationModal showOnInit={registrationType} onClose={onClose} />
      )}
    </section>
  )
}

export default Login
