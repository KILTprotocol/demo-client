import { Crypto, Identity } from '@kiltprotocol/prototype-sdk'
import { EncryptedAsymmetricString } from '@kiltprotocol/prototype-sdk/build/crypto/Crypto'
import PersistentStore from '../state/PersistentStore'

import { Contact } from '../types/Contact'
import { Message, MessageBody } from '../types/Message'
import { BaseDeleteParams, BasePostParams } from './BaseRepository'
import ErrorService from './ErrorService'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class MessageRepository {
  public static async findByMessageId(
    messageId: string,
    myIdentity: Identity
  ): Promise<Message> {
    return fetch(
      `${MessageRepository.URL}/inbox/${
        myIdentity.signPublicKeyAsHex
      }/${messageId}`
    )
      .then(response => response.json())
      .then(message => MessageRepository.decryptMessage(message, myIdentity))
  }

  public static async findByMyIdentity(
    myIdentity: Identity
  ): Promise<Message[]> {
    return fetch(
      `${MessageRepository.URL}/inbox/${myIdentity.signPublicKeyAsHex}`
    )
      .then(response => response.json())
      .then((messages: Message[]) => {
        for (const message of messages) {
          MessageRepository.decryptMessage(message, myIdentity)
        }
        return messages
      })
  }

  public static async findByMyIdentities(
    myIdentities: Identity[]
  ): Promise<Message[]> {
    return Promise.reject('implement')
  }

  public static async send(
    receiver: Contact,
    messageBody: MessageBody
  ): Promise<Message> {
    try {
      const sender = PersistentStore.store.getState().wallet.selected
      const encryptedMessage: EncryptedAsymmetricString = Crypto.encryptAsymmetricAsStr(
        JSON.stringify(messageBody),
        receiver.encryptionKey,
        sender.identity.boxKeyPair.secretKey
      )
      const messageObj: Message = {
        message: encryptedMessage.box,
        nonce: encryptedMessage.nonce,
        receiverKey: receiver.key,
        sender: sender.alias,
        senderEncryptionKey: sender.identity.boxPublicKeyAsHex,
        senderKey: sender.identity.signPublicKeyAsHex,
      }
      return fetch(`${MessageRepository.URL}`, {
        ...BasePostParams,
        body: JSON.stringify(messageObj),
      }).then(response => response.json())
    } catch (error) {
      ErrorService.log({
        error,
        message: 'error just before sending messageBody',
        origin: 'MessageRepository.send()',
      })
      return Promise.reject()
    }
  }

  public static async deleteByMessageId(messageId: string) {
    return fetch(`${MessageRepository.URL}/${messageId}`, {
      ...BaseDeleteParams,
    })
  }

  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/messaging`

  private static decryptMessage(
    message: Message,
    myIdentity: Identity
  ): Message {
    const ea: EncryptedAsymmetricString = {
      box: message.message,
      nonce: message.nonce,
    }
    const decoded: string | false = Crypto.decryptAsymmetricAsStr(
      ea,
      message.senderEncryptionKey,
      myIdentity.boxKeyPair.secretKey
    )
    if (!decoded) {
      message.message = 'ERROR DECODING MESSAGE'
    } else {
      message.message = decoded
    }
    try {
      message.body = JSON.parse(message.message)
    } catch (error) {
      ErrorService.log({
        error,
        message: `Could not parse message body of message ${
          message.id
        } ($m.message)`,
        origin: 'MessageRepository.decryptMessage()',
      })
    }
    return message
  }
}

export default MessageRepository
