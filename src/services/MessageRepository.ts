import { Crypto, Identity } from '@kiltprotocol/prototype-sdk'
import { u8aToHex, u8aToU8a } from '@polkadot/util'

import { Contact } from '../types/Contact'
import { MessageD } from '../types/Message'
import { BaseDeleteParams, BasePostParams } from './BaseRepository'
import * as Wallet from '../state/ducks/Wallet'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class MessageRepository {
  public static async findByMessageId(
    messageId: string,
    myIdentity: Identity
  ): Promise<MessageD> {
    return fetch(
      `${MessageRepository.URL}/inbox/${u8aToHex(
        myIdentity.signKeyPair.publicKey
      )}/${messageId}`
    ).then(response => response.json())
  }

  public static async findByMyIdentity(
    myIdentity: Identity
  ): Promise<MessageD[]> {
    return fetch(
      `${MessageRepository.URL}/inbox/${u8aToHex(
        myIdentity.signKeyPair.publicKey
      )}`
    ).then(response => response.json())
  }

  public static async findByMyIdentities(
    myIdentities: Identity[]
  ): Promise<MessageD[]> {
    return Promise.reject('implement')
  }

  public static async send(
    sender: Wallet.Entry,
    receiver: Contact,
    message: string
  ): Promise<MessageD> {
    const encryptedMessage = Crypto.encryptAsymmetric(
      u8aToU8a(message),
      u8aToU8a(receiver.encryptionKey),
      sender.identity.boxKeyPair.secretKey
    )
    const messageObj: MessageD = {
      message: u8aToHex(encryptedMessage.box),
      nonce: u8aToHex(encryptedMessage.nonce),
      receiverKey: receiver.key,
      sender: sender.alias,
      senderEncryptionKey: u8aToHex(sender.identity.boxKeyPair.publicKey),
      senderKey: u8aToHex(sender.identity.signKeyPair.publicKey),
    }
    return fetch(`${MessageRepository.URL}`, {
      ...BasePostParams,
      body: JSON.stringify(messageObj),
    }).then(response => response.json())
  }

  public static async deleteByMessageId(messageId: string) {
    return fetch(`${MessageRepository.URL}/${messageId}`, {
      ...BaseDeleteParams,
    })
  }
  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/messaging`
}

export default MessageRepository
