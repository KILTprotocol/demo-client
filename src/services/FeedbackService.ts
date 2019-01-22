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
    className,
    message,
    type,
  }: Partial<Notification>): Partial<Notification> {
    const created = Date.now()
    const id = [created, type, message].join('-') as string
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
    PersistentStore.store.dispatch(
      UiState.Store.addNotificationAction(notification as Notification)
    )

    // return completed blockingNotification
    return notification as Notification
  }

  public static removeNotification(id: Notification['id']) {
    PersistentStore.store.dispatch(UiState.Store.removeNotificationAction(id))
  }

  public static addBlockingNotification({
    className,
    message,
    onConfirm,
    type,
  }: Partial<BlockingNotification>): BlockingNotification {
    const blockingNotification: Partial<BlockingNotification> = {
      ...FeedbackService.getNotificationBase({ className, message, type }),
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
    PersistentStore.store.dispatch(
      UiState.Store.addBlockingNotificationAction(
        blockingNotification as BlockingNotification
      )
    )

    // return completed blockingNotification
    return blockingNotification as BlockingNotification
  }

  public static removeBlockingNotification(id: BlockingNotification['id']) {
    PersistentStore.store.dispatch(
      UiState.Store.removeBlockingNotificationAction(id)
    )
  }

  public static addBlockUi({ headline, message }: Partial<BlockUi>): BlockUi {
    const created = Date.now()
    const id = created + (message || '')
    const blockUi: Partial<BlockUi> = { created, id, headline, message }

    blockUi.remove = () => {
      FeedbackService.removeBlockUi(id)
    }

    blockUi.updateMessage = (newMessage: string) => {
      FeedbackService.updateBlockUi(id, newMessage)
    }

    // now put this into redux store UiState
    PersistentStore.store.dispatch(
      UiState.Store.addBlockUiAction(blockUi as BlockUi)
    )

    // return completed blockingNotification
    return blockUi as BlockUi
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
