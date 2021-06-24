import React, { ReactNode } from 'react'
import { UUID } from '@kiltprotocol/utils'

import { ModalType } from '../components/Modal/Modal'
import * as UiState from '../state/ducks/UiState'
import { persistentStoreInstance } from '../state/PersistentStore'
import {
  IBlockingNotification,
  BlockUi,
  INotification,
  NotificationType,
} from '../types/UserFeedback'

class FeedbackService {
  public static getNotificationBase({
    className,
    message,
    type,
  }: Partial<INotification>): Partial<INotification> {
    const created = Date.now()
    const id = UUID.generate()
    return {
      className,
      created,
      id,
      message: message || '',
      type: type || NotificationType.INFO,
    }
  }

  public static addNotification({
    className,
    message,
    type,
  }: Partial<INotification>): INotification {
    const notification: Partial<INotification> = {
      ...FeedbackService.getNotificationBase({ className, message, type }),
    }

    notification.remove = () => {
      FeedbackService.removeNotification(notification.id as INotification['id'])
    }

    // now put this into redux store UiState
    persistentStoreInstance.store.dispatch(
      UiState.Store.addNotificationAction(notification as INotification)
    )

    // return completed blockingNotification
    return notification as INotification
  }

  public static removeNotification(id: INotification['id']): void {
    persistentStoreInstance.store.dispatch(
      UiState.Store.removeNotificationAction(id)
    )
  }

  public static addBlockingNotification({
    className,
    header,
    message,
    onCancel,
    onConfirm,
    modalType,
    type,
    okButtonLabel,
    cancelButtonLabel,
  }: Partial<IBlockingNotification>): IBlockingNotification {
    const blockingNotification: Partial<IBlockingNotification> = {
      ...FeedbackService.getNotificationBase({ className, message, type }),
      cancelButtonLabel,
      header,
      modalType,
      okButtonLabel,
      onCancel,
      onConfirm,
    }

    blockingNotification.remove = () => {
      FeedbackService.removeBlockingNotification(
        blockingNotification.id as IBlockingNotification['id']
      )
    }

    if (onConfirm) {
      blockingNotification.onConfirm = onConfirm
    }

    // now put this into redux store UiState
    persistentStoreInstance.store.dispatch(
      UiState.Store.addBlockingNotificationAction(
        blockingNotification as IBlockingNotification
      )
    )

    // return completed blockingNotification
    return blockingNotification as IBlockingNotification
  }

  public static removeBlockingNotification(
    id: IBlockingNotification['id']
  ): void {
    persistentStoreInstance.store.dispatch(
      UiState.Store.removeBlockingNotificationAction(id)
    )
  }

  public static addBlockUi({ headline, message }: Partial<BlockUi>): BlockUi {
    const created = Date.now()
    const id = UUID.generate()
    const blockUi: Partial<BlockUi> = { created, id, headline, message }

    blockUi.remove = () => {
      FeedbackService.removeBlockUi(id)
    }

    blockUi.updateMessage = (newMessage: string) => {
      FeedbackService.updateBlockUi(id, newMessage)
    }

    // now put this into redux store UiState
    persistentStoreInstance.store.dispatch(
      UiState.Store.addBlockUiAction(blockUi as BlockUi)
    )

    // return completed blockingNotification
    return blockUi as BlockUi
  }

  public static removeBlockUi(id: BlockUi['id']): void {
    persistentStoreInstance.store.dispatch(
      UiState.Store.removeBlockUiAction(id)
    )
  }

  public static updateBlockUi(
    id: BlockUi['id'],
    message: BlockUi['message']
  ): void {
    persistentStoreInstance.store.dispatch(
      UiState.Store.updateBlockUiAction(id, message)
    )
  }
}

function notifyWithType(
  type: NotificationType,
  message: string | ReactNode,
  blocking = false
): void {
  if (blocking) {
    FeedbackService.addBlockingNotification({
      message,
      type,
    })
  } else {
    FeedbackService.addNotification({ message, type })
  }
}

export function notifySuccess(
  message: string | ReactNode,
  blocking = false
): void {
  notifyWithType(NotificationType.SUCCESS, message, blocking)
}

export function notifyFailure(
  message: string | ReactNode,
  blocking = true
): void {
  notifyWithType(NotificationType.FAILURE, message, blocking)
}

function isInvalidTransactionError(error: Error): boolean {
  return error.message.includes('1010: Invalid Transaction')
}

export function notifyError(error: Error, blocking = true): void {
  try {
    if (isInvalidTransactionError(error)) {
      notifyWithType(
        NotificationType.FAILURE,
        <p>
          {error.message}. <p>Are you sure your account has enough funds?</p>
        </p>,
        blocking
      )
    } else {
      notifyWithType(NotificationType.FAILURE, error.message, blocking)
    }
  } catch (err) {
    // ignore
  }
}

export function notify(message: string | ReactNode, blocking = false): void {
  notifyWithType(NotificationType.INFO, message, blocking)
}

export function safeDestructiveAction(
  message: ReactNode,
  onConfirm: (notification: IBlockingNotification) => void,
  removeNotificationInstantly = true,
  onCancel?: (notification: IBlockingNotification) => void
): void {
  FeedbackService.addBlockingNotification({
    header: 'Are you sure?',
    message,
    modalType: ModalType.CONFIRM,
    type: NotificationType.INFO,

    onCancel: (notification: IBlockingNotification) => {
      if (onCancel) {
        onCancel(notification)
      }
      notification.remove()
    },
    onConfirm: (notification: IBlockingNotification) => {
      onConfirm(notification)
      if (removeNotificationInstantly) {
        notification.remove()
      }
    },
  })
}

export function safeDelete(
  message: ReactNode,
  onConfirm: (notification: IBlockingNotification) => void,
  removeNotificationInstantly = true,
  onCancel?: (notification: IBlockingNotification) => void
): void {
  safeDestructiveAction(
    <div>Do you want to delete {message}?</div>,
    onConfirm,
    removeNotificationInstantly,
    onCancel
  )
}

export default FeedbackService
