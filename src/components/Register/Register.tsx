import React, { useState } from 'react'
import './Register.scss'

type Props = {
  submit: (password: string) => void
}

const Register: React.FC<Props> = ({ submit }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = (): void => {
    if (!password) {
      setErrorMessage('Please, enter a password')
      return setError(true)
    }
    if (password.length < 12) {
      setErrorMessage('Password must be 12 characters or greater')
      return setError(true)
    }
    // Allows all ASCII characters
    const regex = /[ -~]/
    if (!regex.test(password)) {
      setErrorMessage(
        'Only characters 0-9, upper case and lower case a-z and ! - ~'
      )
      return setError(true)
    }
    return submit(password)
  }

  return (
    <section className="Register">
      <h2>New User</h2>
      <p>Please create password</p>
      <form
        className="Login"
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <div>
          <label>
            Password{' '}
            <div>
              <input
                value={password}
                type="password"
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </label>
        </div>
        <button type="submit" className="confirm">
          Register
        </button>
      </form>
      {error && <p>{errorMessage}</p>}
    </section>
  )
}

export default Register
