import React, { useState } from 'react'

type Props = {
  submit: (password: string) => void
}

const Login: React.FC<Props> = ({ submit }) => {
  const [password, setPassword] = useState('')

  return (
    <section>
      <h2>Existing User</h2>
      Please login
      <form
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
        <button type="submit">Login</button>
      </form>
    </section>
  )
}

export default Login
