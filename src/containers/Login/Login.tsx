import React, { useState } from 'react'
import RegistrationModal from '../RegistrationModal/RegistrationModal'
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
          <button type="button" className="link" onClick={registration}>
            Create new Account
          </button>
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
