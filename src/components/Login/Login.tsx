import React, { useState } from 'react'
import './Login.scss'

type Props = {
  submit: (password: string) => void
}

const Login: React.FC<Props> = ({ submit }) => {
  const [password, setPassword] = useState('')

  return (
    <section className="Login">
      <h2>Existing User</h2>
      <p>Please login</p>
      <form
        onSubmit={e => {
          e.preventDefault()
          submit(password)
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
        <button type="submit">Login</button>
      </form>
    </section>
  )
}

export default Login
