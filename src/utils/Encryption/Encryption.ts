import {
  encryptSymmetric,
  decryptSymmetric,
  CryptoInput,
  EncryptedSymmetric,
  EncryptedSymmetricString,
} from '@kiltprotocol/sdk-js/build/crypto'
import * as string from '@polkadot/util/string'

export function encryption(
  message: string,
  secret: CryptoInput
): EncryptedSymmetric {
  const data = new Uint8Array(string.stringToU8a(message))
  return encryptSymmetric(data, secret)
}

export function decryption(
  data: EncryptedSymmetric | EncryptedSymmetricString,
  secret: CryptoInput
): Uint8Array | null {
  return decryptSymmetric(data, secret)
}
