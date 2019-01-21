import * as UiState from '../state/ducks/UiState'
import PersistentStore from '../state/PersistentStore'
import {
  BlockingNotification,
  BlockUi,
  Notification,
  NotificationType,
} from '../types/UserFeedback'

class FeedbackService {
  public static getNotificationBase({
    message,
    type,
  }: Partial<Notification>): Notification {
    const now = Date.now()
    const id = [now, type, message].join('-') as string
    return {
      created: now,
      id,
      message: message || '',
      type: type || NotificationType.FAILURE,
    }
  }

  public static addNotification({
    message,
    type,
  }: Partial<Notification>): Notification {
    const notification: Notification = {
      ...FeedbackService.getNotificationBase({ message, type }),
    }

    notification.remove = () => {
      FeedbackService.removeNotification(notification.id)
    }

    // now put this into redux store UiState
    PersistentStore.store.dispatch(
      UiState.Store.addNotificationAction(notification)
    )

    // return completed blockingNotification
    return notification
  }

  public static removeNotification(id: Notification['id']) {
    PersistentStore.store.dispatch(UiState.Store.removeNotificationAction(id))
  }

  public static addBlockingNotification({
    message,
    type,
    onConfirm,
  }: Partial<BlockingNotification>): BlockingNotification {
    const blockingNotification: BlockingNotification = {
      ...FeedbackService.getNotificationBase({ message, type }),
    }

    blockingNotification.remove = () => {
      FeedbackService.removeBlockingNotification(blockingNotification.id)
    }

    if (onConfirm) {
      blockingNotification.onConfirm = onConfirm
    }

    // now put this into redux store UiState
    PersistentStore.store.dispatch(
      UiState.Store.addBlockingNotificationAction(blockingNotification)
    )

    // return completed blockingNotification
    return blockingNotification
  }

  public static removeBlockingNotification(id: BlockingNotification['id']) {
    PersistentStore.store.dispatch(
      UiState.Store.removeBlockingNotificationAction(id)
    )
  }

  public static addBlockUi({ headline, message }: Partial<BlockUi>): BlockUi {
    const id = Date.now() + (message || '')
    const blockUi: BlockUi = { id, headline, message }

    blockUi.remove = () => {
      FeedbackService.removeBlockUi(id)
    }

    blockUi.updateMessage = (newMessage: string) => {
      FeedbackService.updateBlockUi(id, newMessage)
    }

    // now put this into redux store UiState
    PersistentStore.store.dispatch(UiState.Store.addBlockUiAction(blockUi))

    // return completed blockingNotification
    return blockUi
  }

  public static removeBlockUi(id: BlockUi['id']) {
    PersistentStore.store.dispatch(UiState.Store.removeBlockUiAction(id))
  }

  public static updateBlockUi(id: BlockUi['id'], message: BlockUi['message']) {
    PersistentStore.store.dispatch(
      UiState.Store.updateBlockUiAction(id, message)
    )
  }
}

export default FeedbackService
