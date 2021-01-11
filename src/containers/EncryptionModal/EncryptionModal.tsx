import React from 'react'
import { encryption } from '../../utils/Encryption/Encryption'

type Props = {
  message: string | object
}

const EncryptionModal: React.FC<Props> = (props): JSX.Element => {
  const submit = (): void => {
    encryption(JSON.stringify(props.message), 'password')
  }
  return (
    <>
      <>This is a div box</>
      <input />
      <button type="button" onClick={submit}>
        Encrypt
      </button>
    </>
  )
}

export default EncryptionModal
