import {
  encryptSymmetricAsStr,
  decryptSymmetricStr,
  CryptoInput,
  EncryptedSymmetricString,
} from '@kiltprotocol/sdk-js/build/crypto'
import scrypt from 'scrypt-async'
import nacl from 'tweetnacl'

export function encryption(
  message: string,
  secret: CryptoInput
): EncryptedSymmetricString {
  return encryptSymmetricAsStr(message, secret)
}

export function decryption(data: string, secret: CryptoInput): string | null {
  return decryptSymmetricStr(JSON.parse(data), secret)
}

export function passwordHashing(password: string): CryptoInput {
  const nonce = nacl.randomBytes(24)
  let key
  const error = console.error('Password not hashed')
  scrypt(
    password,
    nonce,
    {
      N: 16384,
      r: 8,
      p: 1,
      dkLen: 32,
      encoding: 'hex',
    },
    (derivedKey: any) => {
      key = derivedKey
    }
  )

  if (!key) {
    throw error
  }
  return key
}
