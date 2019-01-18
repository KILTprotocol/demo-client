import Immutable from 'immutable'
import KiltAction from '../../types/Action'
import {
  BlockingNotification,
  BlockUi,
  Notification,
} from '../../types/UserFeedback'

/**
 * Notifications
 */
interface AddNotificationAction extends KiltAction {
  payload: Notification
}

interface RemoveNotificationAction extends KiltAction {
  payload: Notification['id']
}

type NotificationActions = AddNotificationAction | RemoveNotificationAction

/**
 * Blocking Notifications / Modals
 */
interface AddBlockingNotificationAction extends KiltAction {
  payload: BlockingNotification
}

interface RemoveBlockingNotificationAction extends KiltAction {
  payload: BlockingNotification['id']
}

type BlockingNotificationActions =
  | AddBlockingNotificationAction
  | RemoveBlockingNotificationAction

/**
 * Block UI
 */
interface AddBlockUiAction extends KiltAction {
  payload: BlockUi
}

interface RemoveBlockUiAction extends KiltAction {
  payload: BlockUi['id']
}

interface UpdateBlockUiAction extends KiltAction {
  payload: {
    id: BlockUi['id']
    message: BlockUi['message']
  }
}

type BlockUiActions = AddBlockUiAction | RemoveBlockUiAction

type Action = NotificationActions | BlockingNotificationActions | BlockUiActions

type State = {
  notifications: Immutable.Map<Notification['id'], Notification>
  blockingNotifications: Immutable.Map<
    BlockingNotification['id'],
    BlockingNotification
  >
  blockUis: Immutable.Map<BlockUi['id'], BlockUi>
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  uiState: string
}

class Store {
  // TODO: add (de)serialization if needed
  public static serialize(state: ImmutableState) {
    const serialized: SerializedState = {
      uiState: '',
    }
    return serialized
  }

  public static deserialize(
    uiStateSerialized: SerializedState
  ): ImmutableState {
    return Store.createState()
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      // Notifications
      case Store.ACTIONS.NOTIFICATION_ADD:
        const notification: Notification = (action as AddNotificationAction)
          .payload
        return state.setIn(['notifications', notification.id], notification)
      case Store.ACTIONS.NOTIFICATION_REMOVE:
        const notificationId = (action as RemoveNotificationAction).payload
        return state.deleteIn(['notifications', notificationId])
      // Blocking Notifications
      case Store.ACTIONS.BLOCKING_NOTIFICATION_ADD:
        const blockingNotification: BlockingNotification = (action as AddBlockingNotificationAction)
          .payload
        return state.setIn(
          ['blockingNotifications', blockingNotification.id],
          blockingNotification
        )
      case Store.ACTIONS.BLOCKING_NOTIFICATION_REMOVE:
        const blockingNotificationId = (action as RemoveBlockingNotificationAction)
          .payload
        return state.deleteIn(['blockingNotifications', blockingNotificationId])
      // Block Ui
      case Store.ACTIONS.BLOCK_UI_ADD:
        const blockUi: BlockUi = (action as AddBlockUiAction).payload
        return state.setIn(['blockUis', blockUi.id], blockUi)
      case Store.ACTIONS.BLOCK_UI_REMOVE:
        const blockUiId = (action as RemoveBlockUiAction).payload
        return state.deleteIn(['blockUis', blockUiId])
      case Store.ACTIONS.BLOCK_UI_UPDATE:
        const {
          id: updateId,
          message,
        } = (action as UpdateBlockUiAction).payload
        return state.setIn(['blockUis', updateId, 'message'], message)
      default:
        return state
    }
  }

  public static addNotificationAction(
    notification: Notification
  ): AddNotificationAction {
    return {
      payload: notification,
      type: Store.ACTIONS.NOTIFICATION_ADD,
    }
  }

  public static removeNotificationAction(
    id: Notification['id']
  ): RemoveNotificationAction {
    return {
      payload: id,
      type: Store.ACTIONS.NOTIFICATION_REMOVE,
    }
  }

  public static addBlockingNotificationAction(
    blockingNotification: BlockingNotification
  ): AddBlockingNotificationAction {
    return {
      payload: blockingNotification,
      type: Store.ACTIONS.BLOCKING_NOTIFICATION_ADD,
    }
  }

  public static removeBlockingNotificationAction(
    id: BlockingNotification['id']
  ): RemoveBlockingNotificationAction {
    return {
      payload: id,
      type: Store.ACTIONS.BLOCKING_NOTIFICATION_REMOVE,
    }
  }

  public static addBlockUiAction(blockUi: BlockUi): AddBlockUiAction {
    return {
      payload: blockUi,
      type: Store.ACTIONS.BLOCK_UI_ADD,
    }
  }

  public static removeBlockUiAction(id: BlockUi['id']): RemoveBlockUiAction {
    return {
      payload: id,
      type: Store.ACTIONS.BLOCK_UI_REMOVE,
    }
  }

  public static updateBlockUiAction(
    id: BlockUi['id'],
    message: BlockUi['message']
  ): UpdateBlockUiAction {
    return {
      payload: { id, message },
      type: Store.ACTIONS.BLOCK_UI_UPDATE,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      notifications: Immutable.Map<Notification['id'], Notification>(),
      blockingNotifications: Immutable.Map<
        BlockingNotification['id'],
        BlockingNotification
      >(),
      blockUis: Immutable.Map<BlockUi['id'], BlockUi>(),
    } as State)(obj)
  }

  private static ACTIONS = {
    NOTIFICATION_ADD: 'client/uiState/NOTIFICATION_ADD',
    NOTIFICATION_REMOVE: 'client/uiState/NOTIFICATION_REMOVE',
    BLOCKING_NOTIFICATION_ADD: 'client/uiState/BLOCKING_NOTIFICATION_ADD',
    BLOCKING_NOTIFICATION_REMOVE: 'client/uiState/BLOCKING_NOTIFICATION_REMOVE',
    BLOCK_UI_ADD: 'client/uiState/BLOCK_UI_ADD',
    BLOCK_UI_REMOVE: 'client/uiState/BLOCK_UI_REMOVE',
    BLOCK_UI_UPDATE: 'client/uiState/BLOCK_UI_UPDATE',
  }
}

export { Store, ImmutableState, SerializedState, Action }
