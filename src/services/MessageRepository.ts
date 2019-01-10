import { Crypto, Identity } from '@kiltprotocol/prototype-sdk'
import { EncryptedAsymmetricString } from '@kiltprotocol/prototype-sdk/build/crypto/Crypto'
import PersistentStore from '../state/PersistentStore'

import { Contact } from '../types/Contact'
import { MessageD } from '../types/Message'
import { BaseDeleteParams, BasePostParams } from './BaseRepository'
import ErrorService from './ErrorService'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class MessageRepository {
  public static async findByMessageId(
    messageId: string,
    myIdentity: Identity
  ): Promise<MessageD> {
    return fetch(
      `${MessageRepository.URL}/inbox/${
        myIdentity.signPublicKeyAsHex
      }/${messageId}`
    ).then(response => response.json())
  }

  public static async findByMyIdentity(
    myIdentity: Identity
  ): Promise<MessageD[]> {
    return fetch(
      `${MessageRepository.URL}/inbox/${myIdentity.signPublicKeyAsHex}`
    ).then(response => response.json())
  }

  public static async findByMyIdentities(
    myIdentities: Identity[]
  ): Promise<MessageD[]> {
    return Promise.reject('implement')
  }

  public static async send(
    receiver: Contact,
    message: string
  ): Promise<MessageD> {
    try {
      const sender = PersistentStore.store.getState().wallet.selected
      const encryptedMessage: EncryptedAsymmetricString = Crypto.encryptAsymmetricAsStr(
        message,
        receiver.encryptionKey,
        sender.identity.boxKeyPair.secretKey
      )
      const messageObj: MessageD = {
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
      ErrorService.log('fetch.POST', error, 'error just before sending message')
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
}

export default MessageRepository
