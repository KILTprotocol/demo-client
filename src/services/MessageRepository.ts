import * as sdk from '@kiltprotocol/prototype-sdk'

import persistentStore from '../state/PersistentStore'
import { Contact, MyIdentity } from '../types/Contact'
import { BaseDeleteParams, BasePostParams } from './BaseRepository'
import contactRepository from './ContactRepository'
import errorService from './ErrorService'

export interface MessageOutput extends sdk.IMessage {
  encryptedMessage: sdk.IEncryptedMessage
  sender?: Contact
}

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class MessageRepository {
  public static async findByMessageId(
    messageId: string,
    myIdentity: sdk.Identity
  ): Promise<sdk.IMessage | undefined> {
    return fetch(
      `${MessageRepository.URL}/inbox/${
        myIdentity.signPublicKeyAsHex
      }/${messageId}`
    )
      .then(response => response.json())
      .then(message => {
        return contactRepository
          .findByAddress(message.senderAddress)
          .then((sender: Contact) =>
            sdk.Message.createFromEncryptedMessage(
              message,
              sender.publicIdentity,
              myIdentity
            )
          )
      })
  }

  public static async findByMyIdentity(
    myIdentity: sdk.Identity
  ): Promise<MessageOutput[]> {
    return fetch(`${MessageRepository.URL}/inbox/${myIdentity.address}`)
      .then(response => response.json())
      .then((encryptedMessages: sdk.IEncryptedMessage[]) => {
        return Promise.all(
          encryptedMessages.map((encryptedMessage: sdk.IEncryptedMessage) => {
            return contactRepository
              .findByAddress(encryptedMessage.senderAddress)
              .then((sender: Contact) => {
                try {
                  const m: sdk.IMessage = sdk.Message.createFromEncryptedMessage(
                    encryptedMessage,
                    sender.publicIdentity,
                    myIdentity
                  )
                  sdk.Message.ensureOwnerIsSender(m)
                  return {
                    ...m,
                    encryptedMessage,
                    sender,
                  }
                } catch (error) {
                  errorService.log({
                    error,
                    message:
                      'error on decrypting message: ' +
                      JSON.stringify(encryptedMessage),
                    origin: 'MessageRepository.findByMyIdentity()',
                  })
                  return undefined
                }
              })
              .catch(error => {
                errorService.log({
                  error,
                  message:
                    'could not resolve sender of message:' +
                    JSON.stringify(encryptedMessage),
                  origin: 'MessageRepository.findByMyIdentity()',
                })
                return undefined
              })
          })
        ).then((messageOutputList: Array<MessageOutput | undefined>) => {
          return messageOutputList.filter(
            messageOutput => messageOutput
          ) as MessageOutput[]
        })
      })
  }

  public static async send(
    receiver: Contact,
    messageBody: sdk.MessageBody
  ): Promise<void> {
    try {
      const sender: MyIdentity = persistentStore.store.getState().wallet
        .selectedIdentity
      const message: sdk.Message = new sdk.Message(
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
