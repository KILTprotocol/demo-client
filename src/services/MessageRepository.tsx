import { ISubmitAttestationForClaim } from '@kiltprotocol/sdk-js'
import * as sdk from '@kiltprotocol/sdk-js'
import cloneDeep from 'lodash/cloneDeep'
import React from 'react'
import { InteractionProps } from 'react-json-view'
import Code from '../components/Code/Code'
import { ModalType } from '../components/Modal/Modal'
import * as UiState from '../state/ducks/UiState'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import { IContact, IMyIdentity } from '../types/Contact'
import { ICType } from '../types/Ctype'
import { IBlockingNotification, NotificationType } from '../types/UserFeedback'
import { BaseDeleteParams, BasePostParams } from './BaseRepository'
import ContactRepository from './ContactRepository'
import errorService from './ErrorService'
import FeedbackService, {
  notifyFailure,
  notifySuccess,
} from './FeedbackService'

export interface IMessageOutput extends sdk.IMessage {
  encryptedMessage: sdk.IEncryptedMessage
  sender?: IContact
}

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class MessageRepository {
  public static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}/messaging`

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
    receivers: IContact[],
    messageBody: sdk.MessageBody
  ): Promise<void> {
    const sender: IMyIdentity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    )
    const receiversAsArray = Array.isArray(receivers) ? receivers : [receivers]
    const requests = receiversAsArray.reduce(
      (promiseChain, receiver: IContact) => {
        return MessageRepository.singleSend(messageBody, sender, receiver)
      },
      Promise.resolve()
    )
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
    receiverAddresses: Array<IContact['publicIdentity']['address']>,
    messageBody: sdk.MessageBody
  ): Promise<void> {
    const arrayOfPromises = receiverAddresses.map(
      (receiverAddress: IContact['publicIdentity']['address']) => {
        return ContactRepository.findByAddress(receiverAddress)
      }
    )

    return Promise.any(arrayOfPromises)
      .then(result => {
        MessageRepository.handleMultiAddressErrors(result.errors)
        return result.successes
      })
      .then((receiverContacts: IContact[]) => {
        return MessageRepository.send(receiverContacts, messageBody)
      })
  }

  /**
   * takes a public identity
   * converts them to Contacts and initiates message sending
   *
   * @param receivers
   * @param messageBody
   */
  public static sendToPublicIdentity(
    receiver: sdk.IPublicIdentity,
    messageBody: sdk.MessageBody
  ): Promise<void> {
    const receiverContact: IContact = {
      metaData: {
        name: '',
      },
      publicIdentity: receiver,
    }

    return MessageRepository.send([receiverContact], messageBody)
  }

  public static async multiSendToAddresses(
    receiverAddresses: Array<IContact['publicIdentity']['address']>,
    messageBodies: sdk.MessageBody[]
  ): Promise<void> {
    const arrayOfPromises = messageBodies.map(
      (messageBody: sdk.MessageBody) => {
        return MessageRepository.sendToAddresses(receiverAddresses, messageBody)
      }
    )

    return Promise.any(arrayOfPromises)
      .then(result => {
        MessageRepository.handleMultiAddressErrors(result.errors)
        return result.successes
      })
      .then(() => undefined)
  }

  public static async deleteByMessageId(messageId: string): Promise<Response> {
    return fetch(`${MessageRepository.URL}/${messageId}`, {
      ...BaseDeleteParams,
    })
  }

  public static async findByMessageId(
    messageId: string,
    myIdentity: sdk.Identity
  ): Promise<sdk.IMessage | undefined> {
    return fetch(
      `${MessageRepository.URL}/inbox/${myIdentity.signPublicKeyAsHex}/${messageId}`
    )
      .then(response => response.json())
      .then(message => {
        return ContactRepository.findByAddress(message.senderAddress).then(() =>
          sdk.Message.decrypt(message, myIdentity)
        )
      })
  }

  public static async findByMyIdentity(
    myIdentity: sdk.Identity
  ): Promise<IMessageOutput[]> {
    return fetch(`${MessageRepository.URL}/inbox/${myIdentity.getAddress()}`)
      .then(response => response.json())
      .then((encryptedMessages: sdk.IEncryptedMessage[]) => {
        return Promise.any(
          encryptedMessages.map((encryptedMessage: sdk.IEncryptedMessage) => {
            return ContactRepository.findByAddress(
              encryptedMessage.senderAddress
            ).then((contact: IContact) => {
              try {
                const m = sdk.Message.decrypt(encryptedMessage, myIdentity)
                sdk.Message.ensureOwnerIsSender(m)
                let sender = contact
                if (!sender) {
                  sender = {
                    metaData: { name: '', unregistered: true },
                    publicIdentity: {
                      address: encryptedMessage.senderAddress,
                      boxPublicKeyAsHex: encryptedMessage.senderBoxPublicKey,
                    },
                  }
                }

                return {
                  ...m,
                  encryptedMessage,
                  sender,
                }
              } catch (error) {
                errorService.log({
                  error,
                  message: `error on decrypting message: 
                    ${JSON.stringify(encryptedMessage)}`,
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

  public static async dispatchMessage(message: sdk.Message): Promise<Response> {
    const response = await fetch(`${MessageRepository.URL}`, {
      ...BasePostParams,
      body: JSON.stringify(message.encrypt()),
    })
    if (!response.ok) {
      throw new Error(response.statusText)
    }
    return response
  }

  public static async singleSend(
    messageBody: sdk.MessageBody,
    sender: IMyIdentity,
    receiver: IContact
  ): Promise<void> {
    try {
      let message: sdk.Message = new sdk.Message(
        messageBody,
        sender.identity,
        receiver.publicIdentity
      )

      message = await MessageRepository.handleDebugMode(message)

      return MessageRepository.dispatchMessage(message)
        .then(() => {
          notifySuccess(
            `Message '${messageBody.type}' to receiver ${receiver.metaData
              .name || receiver.publicIdentity.address} successfully sent.`
          )
        })
        .catch(error => {
          errorService.logWithNotification({
            error,
            message: `Could not send message '${messageBody.type}' to receiver '${receiver.metaData.name}'`,
            origin: 'MessageRepository.singleSend()',
            type: 'ERROR.FETCH.POST',
          })
        })
    } catch (error) {
      errorService.log({
        error,
        message: `Could not create message '${messageBody.type}' to receiver '${receiver.metaData.name}'`,
        origin: 'MessageRepository.singleSend()',
      })
      return Promise.reject()
    }
  }

  public static getCTypeHashes(
    message: IMessageOutput
  ): Array<ICType['cType']['hash']> {
    const { body } = message
    const { type } = body

    switch (type) {
      case sdk.MessageBodyType.REQUEST_TERMS:
        return [(message.body as sdk.IRequestTerms).content.cTypeHash]
      case sdk.MessageBodyType.SUBMIT_TERMS:
        return [(message.body as sdk.ISubmitTerms).content.claim.cTypeHash]
      case sdk.MessageBodyType.REJECT_TERMS:
        return [(message.body as sdk.IRejectTerms).content.claim.cTypeHash]

      case sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
        return [
          (message.body as sdk.IRequestAttestationForClaim).content
            .requestForAttestation.claim.cTypeHash,
        ]
      case sdk.MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM:
        return [
          (message.body as ISubmitAttestationForClaim).content.attestation
            .cTypeHash,
        ]
      case sdk.MessageBodyType.REJECT_ATTESTATION_FOR_CLAIM:
        return [(message.body as sdk.IRejectAttestationForClaim).type]

      case sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES:
        return (message.body as sdk.IRequestClaimsForCTypes).content.ctypes.filter(
          Boolean
        ) as Array<sdk.ICType['hash']>
      case sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES_PUBLIC: {
        const cTypeHashes = (message.body as sdk.ISubmitClaimsForCTypesPublic).content.map(
          attestedClaim => attestedClaim.request.claim.cTypeHash
        )
        const uniqueCTypeHashes: Array<ICType['cType']['hash']> = cTypeHashes.filter(
          (cTypeHash: ICType['cType']['hash'], index: number) =>
            cTypeHashes.indexOf(cTypeHash) === index
        )
        return uniqueCTypeHashes
      }

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
      return new Promise<sdk.Message>(resolve => {
        FeedbackService.addBlockingNotification({
          header: 'Manipulate your message before sending',
          message: (
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
          ),
          modalType: ModalType.CONFIRM,
          okButtonLabel: 'Send manipulated Message',
          onCancel: (notification: IBlockingNotification) => {
            notification.remove()
            return resolve(message)
          },
          onConfirm: (notification: IBlockingNotification) => {
            notification.remove()
            return resolve(manipulatedMessage)
          },
          type: NotificationType.INFO,
        })
      })
    }
    return message
  }

  private static handleMultiAddressErrors(errors: Error[]): void {
    if (errors.length) {
      notifyFailure(
        `Could not send message to ${
          errors.length > 1 ? 'these addresses' : 'this address'
        }: ${errors.join(', ')}`,
        false
      )
    }
  }
}

export default MessageRepository
