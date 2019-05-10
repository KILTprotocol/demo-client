import {
  IAttestedClaim,
  ISubmitAttestationForClaim,
  MessageBodyType,
} from '@kiltprotocol/prototype-sdk'
import * as sdk from '@kiltprotocol/prototype-sdk'
import cloneDeep from 'lodash/cloneDeep'
import * as React from 'react'
import { InteractionProps } from 'react-json-view'
import Code from '../components/Code/Code'
import CTypePresentation from '../components/CTypePresentation/CTypePresentation'
import { ModalType } from '../components/Modal/Modal'
import * as UiState from '../state/ducks/UiState'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import { Contact, MyIdentity } from '../types/Contact'
import { ICType } from '../types/Ctype'
import { BlockingNotification, NotificationType } from '../types/UserFeedback'
import { BaseDeleteParams, BasePostParams } from './BaseRepository'
import ContactRepository from './ContactRepository'
import errorService from './ErrorService'
import FeedbackService, { notifySuccess } from './FeedbackService'

export interface MessageOutput extends sdk.IMessage {
  encryptedMessage: sdk.IEncryptedMessage
  sender?: Contact
}

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class MessageRepository {
  public static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/messaging`

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
    receivers: Contact[],
    messageBody: sdk.MessageBody
  ): Promise<void> {
    const sender: MyIdentity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    )
    const _receivers = Array.isArray(receivers) ? receivers : [receivers]
    const requests = _receivers.reduce((promiseChain, receiver: Contact) => {
      return MessageRepository.singleSend(messageBody, sender, receiver)
    }, Promise.resolve())
    return requests
  }

  /**
   * takes a address or list of addresses
   * converts them to Contacts and initiates message sending
   *
   * @param receiverAddresses
   * @param messageBody
   */
  public static async sendToAddresses(
    receiverAddresses: Array<Contact['publicIdentity']['address']>,
    messageBody: sdk.MessageBody
  ): Promise<void> {
    const arrayOfPromises = receiverAddresses.map(
      (receiverAddress: Contact['publicIdentity']['address']) => {
        return ContactRepository.findByAddress(receiverAddress)
      }
    )

    return Promise.any(arrayOfPromises)
      .then(result => {
        return result.successes
      })
      .then((receiverContacts: Contact[]) => {
        return MessageRepository.send(receiverContacts, messageBody)
      })
  }

  public static async multiSendToAddresses(
    receiverAddresses: Array<Contact['publicIdentity']['address']>,
    messageBodies: sdk.MessageBody[]
  ): Promise<void> {
    const arrayOfPromises = messageBodies.map(
      (messageBody: sdk.MessageBody) => {
        return MessageRepository.sendToAddresses(receiverAddresses, messageBody)
      }
    )

    return Promise.any(arrayOfPromises)
      .then(result => {
        return result.successes
      })
      .then(() => undefined)
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
        return ContactRepository.findByAddress(message.senderAddress).then(
          (sender: Contact) =>
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
        return Promise.any(
          encryptedMessages.map((encryptedMessage: sdk.IEncryptedMessage) => {
            return ContactRepository.findByAddress(
              encryptedMessage.senderAddress
            ).then((sender: Contact) => {
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
        ).then(result => {
          return result.successes
        })
      })
  }

  public static async singleSend(
    messageBody: sdk.MessageBody,
    sender: MyIdentity,
    receiver: Contact
  ) {
    try {
      let message: sdk.Message = new sdk.Message(
        messageBody,
        sender.identity,
        receiver.publicIdentity
      )

      message = await MessageRepository.handleDebugMode(message)

      return fetch(`${MessageRepository.URL}`, {
        ...BasePostParams,
        body: JSON.stringify(message.getEncryptedMessage()),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(response.statusText)
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
      return Promise.reject()
    }
  }

  public static getCTypeHashes(
    message: MessageOutput
  ): Array<ICType['cType']['hash']> {
    const { body } = message
    const { type } = body

    switch (type) {
      case sdk.MessageBodyType.REQUEST_LEGITIMATIONS:
        return [(message.body as sdk.IRequestLegitimations).content.cType]
      case sdk.MessageBodyType.SUBMIT_LEGITIMATIONS:
        return [(message.body as sdk.ISubmitLegitimations).content.claim.cType]
      case sdk.MessageBodyType.REJECT_LEGITIMATIONS:
        return [(message.body as sdk.IRejectLegitimations).content.claim.cType]

      case sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
        return [
          (message.body as sdk.IRequestAttestationForClaim).content.claim.cType,
        ]
      case sdk.MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM:
        return [
          (message.body as ISubmitAttestationForClaim).content.request.claim
            .cType,
        ]
      case sdk.MessageBodyType.REJECT_ATTESTATION_FOR_CLAIM:
        return [
          (message.body as sdk.IRejectAttestationForClaim).content.claim.cType,
        ]

      case sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES:
        return (message.body as sdk.IRequestClaimsForCTypes).content
      case sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES:
        const cTypeHashes: Array<
          ICType['cType']['hash']
        > = (message.body as sdk.ISubmitClaimsForCTypes).content.map(
          (attestedClaim: IAttestedClaim) => attestedClaim.request.claim.cType
        )
        const uniqueCTypeHashes: Array<
          ICType['cType']['hash']
        > = cTypeHashes.filter(
          (cTypeHash: ICType['cType']['hash'], index: number) =>
            cTypeHashes.indexOf(cTypeHash) === index
        )
        return uniqueCTypeHashes
      case sdk.MessageBodyType.ACCEPT_CLAIMS_FOR_CTYPES:
        return [
          (message.body as sdk.IAcceptClaimsForCTypes).content[0].request.hash,
        ]
      case sdk.MessageBodyType.REJECT_CLAIMS_FOR_CTYPES:
        return [
          (message.body as sdk.IRejectClaimsForCTypes).content[0].request.hash,
        ]

      case sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION:
      case sdk.MessageBodyType.SUBMIT_ACCEPT_DELEGATION:
      case sdk.MessageBodyType.REJECT_ACCEPT_DELEGATION:
      case sdk.MessageBodyType.INFORM_CREATE_DELEGATION:
        return []

      default:
        return []
    }
  }

  private static async handleDebugMode(
    message: sdk.Message
  ): Promise<sdk.Message> {
    const debugMode = UiState.getDebugMode(PersistentStore.store.getState())

    let manipulatedMessage = cloneDeep(message)

    if (debugMode) {
      return new Promise<sdk.Message>(async resolve => {
        FeedbackService.addBlockingNotification({
          header: 'Manipulate your message before sending',
          message: (
            /* tslint:disable:jsx-no-lambda */
            <Code
              onEdit={(edit: InteractionProps) => {
                manipulatedMessage = edit.updated_src as sdk.Message
              }}
              onAdd={(add: InteractionProps) => {
                manipulatedMessage = add.updated_src as sdk.Message
              }}
            >
              {message}
            </Code>
            /* tslint:enable:jsx-no-lambda */
          ),
          modalType: ModalType.CONFIRM,
          okButtonLabel: 'Send manipulated Message',
          onCancel: (notification: BlockingNotification) => {
            notification.remove()
            return resolve(message)
          },
          onConfirm: (notification: BlockingNotification) => {
            notification.remove()
            return resolve(manipulatedMessage)
          },
          type: NotificationType.INFO,
        })
      })
    }
    return message
  }
}

export default MessageRepository
