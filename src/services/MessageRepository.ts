import * as sdk from '@kiltprotocol/prototype-sdk'

import persistentStore from '../state/PersistentStore'
import { Contact, MyIdentity } from '../types/Contact'
import { BaseDeleteParams, BasePostParams } from './BaseRepository'
import contactRepository from './ContactRepository'
import errorService from './ErrorService'
import { notifySuccess } from './FeedbackService'

export interface MessageOutput extends sdk.IMessage {
  encryptedMessage: sdk.IEncryptedMessage
  sender?: Contact
}

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class MessageRepository {
  /**
   * takes contact or list of contacts
   * and send a message to every contact in list
   *
   * TODO: combine notifications into a one success and one failure
   *
   * @param receivers
   * @param messageBody
   */
  public static async send(
    receivers: Contact | Contact[],
    messageBody: sdk.MessageBody
  ): Promise<void> {
    const sender: MyIdentity = persistentStore.store.getState().wallet
      .selectedIdentity

    if (Array.isArray(receivers)) {
      receivers.forEach((receiver: Contact) => {
        MessageRepository.singleSend(messageBody, sender, receiver)
      })
    } else {
      MessageRepository.singleSend(messageBody, sender, receivers)
    }
  }

  /**
   * takes a address or list of addresses
   * converts them to Contacts and initiates message sending
   *
   * @param receiverAddresses
   * @param messageBody
   */
  public static sendToAddress(
    receiverAddresses:
      | Contact['publicIdentity']['address']
      | Array<Contact['publicIdentity']['address']>,
    messageBody: sdk.MessageBody
  ): Promise<void> {
    // normalize address(es)
    const receiverAddressArray: string[] = Array.isArray(receiverAddresses)
      ? receiverAddresses
      : [receiverAddresses]

    const arrayOfPromises = receiverAddressArray.map(
      (receiverAddress: Contact['publicIdentity']['address']) => {
        return contactRepository.findByAddress(receiverAddress)
      }
    )

    return Promise.all(arrayOfPromises)
      .catch(error => {
        return arrayOfPromises
      })
      .then((receiverContacts: Contact[]) => {
        return MessageRepository.send(
          receiverContacts.filter(
            (receiverContact: Contact) => receiverContact
          ),
          messageBody
        )
      })
  }

  public static async deleteByMessageId(messageId: string) {
    return fetch(`${MessageRepository.URL}/${messageId}`, {
      ...BaseDeleteParams,
    })
  }

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
          })
        ).then((messageOutputList: Array<MessageOutput | undefined>) => {
          return messageOutputList.filter(
            messageOutput => messageOutput
          ) as MessageOutput[]
        })
      })
  }

  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/messaging`

  private static singleSend(
    messageBody: sdk.MessageBody,
    sender: MyIdentity,
    receiver: Contact
  ) {
    try {
      const message: sdk.Message = new sdk.Message(
        messageBody,
        sender.identity,
        receiver.publicIdentity
      )
      fetch(`${MessageRepository.URL}`, {
        ...BasePostParams,
        body: JSON.stringify(message.getEncryptedMessage()),
      })
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText)
          }
          return response
        })
        .then(response => response.json())
        .then(() => {
          notifySuccess(
            `Message '${messageBody.type}' to ${
              receiver!.metaData.name
            } successfully sent.`
          )
        })
        .catch(error => {
          errorService.logWithNotification({
            error,
            message: `Could not send message '${
              messageBody.type
            }' to receiver '${receiver!.metaData.name}'`,
            origin: 'MessageRepository.singleSend()',
            type: 'ERROR.FETCH.POST',
          })
        })
    } catch (error) {
      errorService.log({
        error,
        message: `Could not create message '${messageBody.type}' to receiver '${
          receiver!.metaData.name
        }'`,
        origin: 'MessageRepository.singleSend()',
      })
    }
  }
}

export default MessageRepository
