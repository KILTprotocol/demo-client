import {
  Identity,
  IEncryptedMessage,
  MessageBody,
} from '@kiltprotocol/prototype-sdk'
import { IMessage } from '@kiltprotocol/prototype-sdk'

import persistentStore from '../state/PersistentStore'
import { Contact, MyIdentity } from '../types/Contact'
import { BaseDeleteParams, BasePostParams } from './BaseRepository'
import contactRepository from './ContactRepository'
import errorService from './ErrorService'
import Message from '@kiltprotocol/prototype-sdk/build/messaging/Message'

export interface MessageOutput extends IMessage {
  sender?: Contact
}

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class MessageRepository {
  public static async findByMessageId(
    messageId: string,
    myIdentity: Identity
  ): Promise<IMessage | undefined> {
    return fetch(
      `${MessageRepository.URL}/inbox/${
        myIdentity.signPublicKeyAsHex
      }/${messageId}`
    )
      .then(response => response.json())
      .then(message => {
        const sender: Contact | undefined = contactRepository.findByAddress(
          message.senderAddress
        )
        if (sender) {
          return Message.createFromEncryptedMessage(
            message,
            sender.publicIdentity,
            myIdentity
          )
        }
        return undefined
      })
  }

  public static async findByMyIdentity(
    myIdentity: Identity
  ): Promise<MessageOutput[]> {
    return fetch(`${MessageRepository.URL}/inbox/${myIdentity.address}`)
      .then(response => response.json())
      .then(async (messages: IMessage[]) => {
        await contactRepository.findAll()
        return messages
      })
      .then((encryptedMessages: IEncryptedMessage[]) => {
        const result: MessageOutput[] = []
        for (const enctyptedMessage of encryptedMessages) {
          const sender: Contact | undefined = contactRepository.findByAddress(
            enctyptedMessage.senderAddress
          )
          if (sender) {
            const m: IMessage = Message.createFromEncryptedMessage(
              enctyptedMessage,
              sender.publicIdentity,
              myIdentity
            )
            result.push({
              ...m,
              sender,
            })
          }
        }
        return result
      })
  }

  public static async send(
    receiver: Contact,
    messageBody: MessageBody
  ): Promise<void> {
    try {
      const sender: MyIdentity = persistentStore.store.getState().wallet
        .selectedIdentity
      const message: Message = new Message(
        messageBody,
        sender.identity,
        receiver.publicIdentity
      )

      return fetch(`${MessageRepository.URL}`, {
        ...BasePostParams,
        body: JSON.stringify(message.getEncryptedMessage()),
      }).then(response => response.json())
    } catch (error) {
      errorService.log({
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
}

export default MessageRepository
