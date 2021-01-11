import {
  encryptSymmetricAsStr,
  decryptSymmetricStr,
  CryptoInput,
  EncryptedSymmetricString,
} from '@kiltprotocol/sdk-js/build/crypto'

export function encryption(
  message: string,
  secret: CryptoInput
): EncryptedSymmetricString {
  return encryptSymmetricAsStr(message, secret)
}

export function decryption(data: string, secret: CryptoInput): string | null {
  return decryptSymmetricStr(JSON.parse(data), secret)
}
