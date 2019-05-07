import Immutable from 'immutable'
import { createSelector } from 'reselect'

import { TaskProps } from '../../containers/Tasks/Tasks'
import KiltAction from '../../types/Action'
import {
  BlockingNotification,
  BlockUi,
  Notification,
} from '../../types/UserFeedback'
import { State as ReduxState } from '../PersistentStore'

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

interface UpdateCurrentTaskAction extends KiltAction {
  payload: TaskProps | undefined
}

type BlockUiActions = AddBlockUiAction | RemoveBlockUiAction

/**
 * debug state
 */
interface SetDebugModeAction extends KiltAction {
  payload: boolean
}

/**
 * debug state
 */
interface RefreshAttestationStatusAction extends KiltAction {
  payload: undefined
}

/**
 *
 */
type Action =
  | NotificationActions
  | BlockingNotificationActions
  | BlockUiActions
  | SetDebugModeAction
  | UpdateCurrentTaskAction
  | RefreshAttestationStatusAction

type State = {
  notifications: Immutable.Map<Notification['id'], Notification>
  blockingNotifications: Immutable.Map<
    BlockingNotification['id'],
    BlockingNotification
  >
  blockUis: Immutable.Map<BlockUi['id'], BlockUi>

  attestationStatusCycle: number
  currentTask: Immutable.List<TaskProps>
  debugMode: boolean
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
      case Store.ACTIONS.NOTIFICATION_ADD: {
        const notification: Notification = (action as AddNotificationAction)
          .payload
        return state.setIn(['notifications', notification.id], notification)
      }
      case Store.ACTIONS.NOTIFICATION_REMOVE: {
        const notificationId = (action as RemoveNotificationAction).payload
        return state.deleteIn(['notifications', notificationId])
      }
      // Blocking Notifications
      case Store.ACTIONS.BLOCKING_NOTIFICATION_ADD: {
        const blockingNotification: BlockingNotification = (action as AddBlockingNotificationAction)
          .payload
        return state.setIn(
          ['blockingNotifications', blockingNotification.id],
          blockingNotification
        )
      }
      case Store.ACTIONS.BLOCKING_NOTIFICATION_REMOVE: {
        const blockingNotificationId = (action as RemoveBlockingNotificationAction)
          .payload
        return state.deleteIn(['blockingNotifications', blockingNotificationId])
      }
      // Block Ui
      case Store.ACTIONS.BLOCK_UI_ADD: {
        const blockUi: BlockUi = (action as AddBlockUiAction).payload
        return state.setIn(['blockUis', blockUi.id], blockUi)
      }
      case Store.ACTIONS.BLOCK_UI_REMOVE: {
        const blockUiId = (action as RemoveBlockUiAction).payload
        return state.deleteIn(['blockUis', blockUiId])
      }
      case Store.ACTIONS.BLOCK_UI_UPDATE: {
        const { id, message } = (action as UpdateBlockUiAction).payload
        return state.setIn(['blockUis', id, 'message'], message)
      }
      case Store.ACTIONS.SET_DEBUG_MODE: {
        const debugMode = (action as SetDebugModeAction).payload
        return state.setIn(['debugMode'], debugMode)
      }
      // current task
      case Store.ACTIONS.CURRENT_TASK_UPDATE: {
        const { objective, props } = (action as UpdateCurrentTaskAction)
          .payload as TaskProps
        return state.setIn(['currentTask'], [{ objective, props }])
      }
      // attestation status
      case Store.ACTIONS.ATTESTATION_STATUS_REFRESH: {
        const cycle = state.getIn(['attestationStatusCycle'])
        return state.setIn(['attestationStatusCycle'], cycle + 1)
      }
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

  public static setDebugModeAction(debug: boolean): SetDebugModeAction {
    return {
      payload: debug,
      type: Store.ACTIONS.SET_DEBUG_MODE,
    }
  }

  public static updateCurrentTaskAction(
    taskProps: TaskProps
  ): UpdateCurrentTaskAction {
    return {
      payload: taskProps,
      type: Store.ACTIONS.CURRENT_TASK_UPDATE,
    }
  }

  public static refreshAttestationStatusAction(): RefreshAttestationStatusAction {
    return {
      payload: undefined,
      type: Store.ACTIONS.ATTESTATION_STATUS_REFRESH,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      blockUis: Immutable.Map<BlockUi['id'], BlockUi>(),
      blockingNotifications: Immutable.Map<
        BlockingNotification['id'],
        BlockingNotification
      >(),
      notifications: Immutable.Map<Notification['id'], Notification>(),

      attestationStatusCycle: 0,
      currentTask: Immutable.List<TaskProps>(),
      debugMode: false,
    } as State)(obj)
  }

  private static ACTIONS = {
    BLOCKING_NOTIFICATION_ADD: 'client/uiState/BLOCKING_NOTIFICATION_ADD',
    BLOCKING_NOTIFICATION_REMOVE: 'client/uiState/BLOCKING_NOTIFICATION_REMOVE',
    BLOCK_UI_ADD: 'client/uiState/BLOCK_UI_ADD',
    BLOCK_UI_REMOVE: 'client/uiState/BLOCK_UI_REMOVE',
    BLOCK_UI_UPDATE: 'client/uiState/BLOCK_UI_UPDATE',
    NOTIFICATION_ADD: 'client/uiState/NOTIFICATION_ADD',
    NOTIFICATION_REMOVE: 'client/uiState/NOTIFICATION_REMOVE',

    ATTESTATION_STATUS_REFRESH: 'client/uiState/ATTESTATION_STATUS_REFRESH',
    CURRENT_TASK_UPDATE: 'client/uiState/CURRENT_TASK_UPDATE',
    SET_DEBUG_MODE: 'client/uiState/SET_DEBUG_MODE',
  }
}

const _getNotifications = (state: ReduxState): Notification[] =>
  state.uiState
    .get('notifications')
    .toList()
    .toArray()
    .sort((a: Notification, b: Notification) => a.created - b.created)

const getNotifications = createSelector(
  [_getNotifications],
  (notifications: Notification[]) => notifications
)

const _getBlockUis = (state: ReduxState): BlockUi[] =>
  state.uiState
    .get('blockUis')
    .toList()
    .toArray()
    .sort((a: BlockUi, b: BlockUi) => a.created - b.created)

const getBlockUis = createSelector(
  [_getBlockUis],
  (blockUis: BlockUi[]) => blockUis
)

const _getBlockingNotifications = (state: ReduxState): BlockingNotification[] =>
  state.uiState
    .get('blockingNotifications')
    .toList()
    .toArray()
    .sort((a: Notification, b: Notification) => a.created - b.created)

const getBlockingNotifications = createSelector(
  [_getBlockingNotifications],
  (blockingNotifications: BlockingNotification[]) => blockingNotifications
)

const _getCurrentTask = (state: ReduxState): TaskProps =>
  state.uiState.get('currentTask')[0]

const getCurrentTask = createSelector(
  [_getCurrentTask],
  (currentTask: TaskProps) => currentTask
)

const _getDebugMode = (state: ReduxState): boolean =>
  state.uiState.get('debugMode')

const getDebugMode = createSelector(
  [_getDebugMode],
  (debugMode: boolean) => debugMode
)

const _getAttestationStatusCycle = (state: ReduxState): number =>
  state.uiState.get('attestationStatusCycle')

const getAttestationStatusCycle = createSelector(
  [_getAttestationStatusCycle],
  (cycle: number) => cycle
)

export {
  Store,
  ImmutableState,
  SerializedState,
  Action,
  getNotifications,
  getBlockUis,
  getBlockingNotifications,
  getCurrentTask,
  getDebugMode,
  getAttestationStatusCycle,
}
