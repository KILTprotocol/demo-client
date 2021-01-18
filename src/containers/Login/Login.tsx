import React, { useState } from 'react'
import RegistrationModal from '../RegistrationModal/RegistrationModal'
import './Login.scss'

const Login: React.FC = () => {
  const [registrationType, setRegistrationType] = useState(false)
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
    <>
      {!registrationType && (
        <form className="Login">
          <label>
            Username: <input type="user" />
          </label>
          <label>
            Password: <input type="password" />
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
    </>
  )
}

export default Login
