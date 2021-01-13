import {
  encryptSymmetricAsStr,
  decryptSymmetricStr,
  CryptoInput,
  EncryptedSymmetricString,
  coToUInt8,
} from '@kiltprotocol/sdk-js/build/crypto'
import { scrypt } from 'scrypt-js'

export function encryption(
  message: string,
  secret: CryptoInput
): EncryptedSymmetricString {
  return encryptSymmetricAsStr(message, secret)
}

export function decryption(data: string, secret: CryptoInput): string | null {
  return decryptSymmetricStr(JSON.parse(data), secret)
}

export function passwordHashing(
  password: string,
  salt: string
): Promise<Uint8Array> {
  const N = 1024
  const r = 8
  const p = 1
  const dkLen = 32
  return scrypt(coToUInt8(password), coToUInt8(salt), N, r, p, dkLen)
}
