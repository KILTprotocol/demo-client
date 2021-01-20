import React, { useState } from 'react'

type Props = {
  submit: (password: string) => void
}

const Register: React.FC<Props> = ({ submit }) => {
  const [password, setPassword] = useState('')

  return (
    <section>
      <h2>New User</h2>
      Please create password
      <form
        className="Login"
        onSubmit={e => {
          e.preventDefault()
          submit(password)
        }}
      >
        <label>
          Password:{' '}
          <input
            value={password}
            type="password"
            onChange={e => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" className="confirm">
          Login
        </button>
      </form>
    </section>
  )
}

export default Register
