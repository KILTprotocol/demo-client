import React, { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'

import { ModalType } from '../components/Modal/Modal'
import * as UiState from '../state/ducks/UiState'
import persistentStore from '../state/PersistentStore'
import {
  BlockingNotification,
  BlockUi,
  Notification,
  NotificationType,
} from '../types/UserFeedback'

class FeedbackService {
  public static getNotificationBase({
    className,
    message,
    type,
  }: Partial<Notification>): Partial<Notification> {
    const created = Date.now()
    const id = uuid()
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
  }: Partial<Notification>): Notification {
    const notification: Partial<Notification> = {
      ...FeedbackService.getNotificationBase({ className, message, type }),
    }

    notification.remove = () => {
      FeedbackService.removeNotification(notification.id as Notification['id'])
    }

    // now put this into redux store UiState
    persistentStore.store.dispatch(
      UiState.Store.addNotificationAction(notification as Notification)
    )

    // return completed blockingNotification
    return notification as Notification
  }

  public static removeNotification(id: Notification['id']) {
    persistentStore.store.dispatch(UiState.Store.removeNotificationAction(id))
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
  }: Partial<BlockingNotification>): BlockingNotification {
    const blockingNotification: Partial<BlockingNotification> = {
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
        blockingNotification.id as BlockingNotification['id']
      )
    }

    if (onConfirm) {
      blockingNotification.onConfirm = onConfirm
    }

    // now put this into redux store UiState
    persistentStore.store.dispatch(
      UiState.Store.addBlockingNotificationAction(
        blockingNotification as BlockingNotification
      )
    )

    // return completed blockingNotification
    return blockingNotification as BlockingNotification
  }

  public static removeBlockingNotification(id: BlockingNotification['id']) {
    persistentStore.store.dispatch(
      UiState.Store.removeBlockingNotificationAction(id)
    )
  }

  public static addBlockUi({ headline, message }: Partial<BlockUi>): BlockUi {
    const created = Date.now()
    const id = uuid()
    const blockUi: Partial<BlockUi> = { created, id, headline, message }

    blockUi.remove = () => {
      FeedbackService.removeBlockUi(id)
    }

    blockUi.updateMessage = (newMessage: string) => {
      FeedbackService.updateBlockUi(id, newMessage)
    }

    // now put this into redux store UiState
    persistentStore.store.dispatch(
      UiState.Store.addBlockUiAction(blockUi as BlockUi)
    )

    // return completed blockingNotification
    return blockUi as BlockUi
  }

  public static removeBlockUi(id: BlockUi['id']) {
    persistentStore.store.dispatch(UiState.Store.removeBlockUiAction(id))
  }

  public static updateBlockUi(id: BlockUi['id'], message: BlockUi['message']) {
    persistentStore.store.dispatch(
      UiState.Store.updateBlockUiAction(id, message)
    )
  }
}

function _notify(
  type: NotificationType,
  message: string | ReactNode,
  blocking = false
) {
  blocking
    ? FeedbackService.addBlockingNotification({
        message,
        type,
      })
    : FeedbackService.addNotification({ message, type })
}

export function notifySuccess(message: string | ReactNode, blocking = false) {
  _notify(NotificationType.SUCCESS, message, blocking)
}

export function notifyFailure(message: string | ReactNode, blocking = true) {
  _notify(NotificationType.FAILURE, message, blocking)
}

export function notify(message: string | ReactNode, blocking = false) {
  _notify(NotificationType.INFO, message, blocking)
}

export function safeDelete(
  message: ReactNode,
  onConfirm: (notification: BlockingNotification) => void,
  removeNotificationInstantly = true,
  onCancel?: (notification: BlockingNotification) => void
) {
  FeedbackService.addBlockingNotification({
    header: 'Are you sure?',
    message: <div>Do you want to delete {message}?</div>,
    modalType: ModalType.CONFIRM,
    type: NotificationType.INFO,

    onCancel: (notification: BlockingNotification) => {
      if (onCancel) {
        onCancel(notification)
      }
      notification.remove()
    },
    onConfirm: (notification: BlockingNotification) => {
      onConfirm(notification)
      if (removeNotificationInstantly) {
        notification.remove()
      }
    },
  })
}

export default FeedbackService
