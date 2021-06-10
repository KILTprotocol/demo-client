import Immutable from 'immutable'
import { createSelector } from 'reselect'

import { TaskProps } from '../../containers/Tasks/Tasks'
import KiltAction from '../../types/Action'
import {
  IBlockingNotification,
  BlockUi,
  INotification,
} from '../../types/UserFeedback'
import { State as ReduxState } from '../PersistentStore'

/**
 * Notifications
 */
interface IAddNotificationAction extends KiltAction {
  payload: INotification
}

interface IRemoveNotificationAction extends KiltAction {
  payload: INotification['id']
}

type NotificationActions = IAddNotificationAction | IRemoveNotificationAction

/**
 * Blocking Notifications / Modals
 */
interface IAddBlockingNotificationAction extends KiltAction {
  payload: IBlockingNotification
}

interface IRemoveBlockingNotificationAction extends KiltAction {
  payload: IBlockingNotification['id']
}

type BlockingNotificationActions =
  | IAddBlockingNotificationAction
  | IRemoveBlockingNotificationAction

/**
 * Block UI
 */
interface IAddBlockUiAction extends KiltAction {
  payload: BlockUi
}

interface IRemoveBlockUiAction extends KiltAction {
  payload: BlockUi['id']
}

interface IUpdateBlockUiAction extends KiltAction {
  payload: {
    id: BlockUi['id']
    message: BlockUi['message']
  }
}

interface IUpdateCurrentTaskAction extends KiltAction {
  payload: TaskProps | undefined
}

type BlockUiActions = IAddBlockUiAction | IRemoveBlockUiAction

/**
 * debug state
 */
interface ISetDebugModeAction extends KiltAction {
  payload: boolean
}

/**
 * debug state
 */
interface IRefreshAttestationStatusAction extends KiltAction {
  payload: undefined
}

/**
 *
 */
export type Action =
  | NotificationActions
  | BlockingNotificationActions
  | BlockUiActions
  | ISetDebugModeAction
  | IUpdateCurrentTaskAction
  | IRefreshAttestationStatusAction

type State = {
  notifications: Immutable.Map<INotification['id'], INotification>
  blockingNotifications: Immutable.Map<
    IBlockingNotification['id'],
    IBlockingNotification
  >
  blockUis: Immutable.Map<BlockUi['id'], BlockUi>

  attestationStatusCycle: number
  currentTask: Immutable.List<TaskProps>
  debugMode: boolean
}

export type ImmutableState = Immutable.Record<State>

export type SerializedState = {
  uiState: string
}

class Store {
  // TODO: add (de)serialization if needed
  public static serialize(): SerializedState {
    const serialized: SerializedState = {
      uiState: '',
    }
    return serialized
  }

  public static deserialize(): ImmutableState {
    return Store.createState()
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      // Notifications
      case Store.ACTIONS.NOTIFICATION_ADD: {
        const notification: INotification = (action as IAddNotificationAction)
          .payload
        return state.setIn(['notifications', notification.id], notification)
      }
      case Store.ACTIONS.NOTIFICATION_REMOVE: {
        const notificationId = (action as IRemoveNotificationAction).payload
        return state.deleteIn(['notifications', notificationId])
      }
      // Blocking Notifications
      case Store.ACTIONS.BLOCKING_NOTIFICATION_ADD: {
        const blockingNotification: IBlockingNotification = (action as IAddBlockingNotificationAction)
          .payload
        return state.setIn(
          ['blockingNotifications', blockingNotification.id],
          blockingNotification
        )
      }
      case Store.ACTIONS.BLOCKING_NOTIFICATION_REMOVE: {
        const blockingNotificationId = (action as IRemoveBlockingNotificationAction)
          .payload
        return state.deleteIn(['blockingNotifications', blockingNotificationId])
      }
      // Block Ui
      case Store.ACTIONS.BLOCK_UI_ADD: {
        const blockUi: BlockUi = (action as IAddBlockUiAction).payload
        return state.setIn(['blockUis', blockUi.id], blockUi)
      }
      case Store.ACTIONS.BLOCK_UI_REMOVE: {
        const blockUiId = (action as IRemoveBlockUiAction).payload
        return state.deleteIn(['blockUis', blockUiId])
      }
      case Store.ACTIONS.BLOCK_UI_UPDATE: {
        const { id, message } = (action as IUpdateBlockUiAction).payload
        return state.setIn(['blockUis', id, 'message'], message)
      }
      case Store.ACTIONS.SET_DEBUG_MODE: {
        const debugMode = (action as ISetDebugModeAction).payload
        return state.setIn(['debugMode'], debugMode)
      }
      // current task
      case Store.ACTIONS.CURRENT_TASK_UPDATE: {
        const { objective, props } = (action as IUpdateCurrentTaskAction)
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
    notification: INotification
  ): IAddNotificationAction {
    return {
      payload: notification,
      type: Store.ACTIONS.NOTIFICATION_ADD,
    }
  }

  public static removeNotificationAction(
    id: INotification['id']
  ): IRemoveNotificationAction {
    return {
      payload: id,
      type: Store.ACTIONS.NOTIFICATION_REMOVE,
    }
  }

  public static addBlockingNotificationAction(
    blockingNotification: IBlockingNotification
  ): IAddBlockingNotificationAction {
    return {
      payload: blockingNotification,
      type: Store.ACTIONS.BLOCKING_NOTIFICATION_ADD,
    }
  }

  public static removeBlockingNotificationAction(
    id: IBlockingNotification['id']
  ): IRemoveBlockingNotificationAction {
    return {
      payload: id,
      type: Store.ACTIONS.BLOCKING_NOTIFICATION_REMOVE,
    }
  }

  public static addBlockUiAction(blockUi: BlockUi): IAddBlockUiAction {
    return {
      payload: blockUi,
      type: Store.ACTIONS.BLOCK_UI_ADD,
    }
  }

  public static removeBlockUiAction(id: BlockUi['id']): IRemoveBlockUiAction {
    return {
      payload: id,
      type: Store.ACTIONS.BLOCK_UI_REMOVE,
    }
  }

  public static updateBlockUiAction(
    id: BlockUi['id'],
    message: BlockUi['message']
  ): IUpdateBlockUiAction {
    return {
      payload: { id, message },
      type: Store.ACTIONS.BLOCK_UI_UPDATE,
    }
  }

  public static setDebugModeAction(debug: boolean): ISetDebugModeAction {
    return {
      payload: debug,
      type: Store.ACTIONS.SET_DEBUG_MODE,
    }
  }

  public static updateCurrentTaskAction(
    taskProps: TaskProps
  ): IUpdateCurrentTaskAction {
    return {
      payload: taskProps,
      type: Store.ACTIONS.CURRENT_TASK_UPDATE,
    }
  }

  public static refreshAttestationStatusAction(): IRefreshAttestationStatusAction {
    return {
      payload: undefined,
      type: Store.ACTIONS.ATTESTATION_STATUS_REFRESH,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      blockUis: Immutable.Map<BlockUi['id'], BlockUi>(),
      blockingNotifications: Immutable.Map<
        IBlockingNotification['id'],
        IBlockingNotification
      >(),
      notifications: Immutable.Map<INotification['id'], INotification>(),

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

const getStateNotifications = (state: ReduxState): INotification[] =>
  state.uiState
    .get('notifications')
    .toList()
    .toArray()
    .sort((a: INotification, b: INotification) => a.created - b.created)

const getNotifications = createSelector(
  [getStateNotifications],
  (notifications: INotification[]) => notifications
)

const getStateBlockUis = (state: ReduxState): BlockUi[] =>
  state.uiState
    .get('blockUis')
    .toList()
    .toArray()
    .sort((a: BlockUi, b: BlockUi) => a.created - b.created)

const getBlockUis = createSelector(
  [getStateBlockUis],
  (blockUis: BlockUi[]) => blockUis
)

const getStateBlockingNotifications = (
  state: ReduxState
): IBlockingNotification[] =>
  state.uiState
    .get('blockingNotifications')
    .toList()
    .toArray()
    .sort((a: INotification, b: INotification) => a.created - b.created)

const getBlockingNotifications = createSelector(
  [getStateBlockingNotifications],
  (blockingNotifications: IBlockingNotification[]) => blockingNotifications
)

const getStateCurrentTask = (state: ReduxState): TaskProps | undefined =>
  // TODO: conflicting with its declaration, this does NOT return an Immutable.List
  // @ts-ignore
  state.uiState.get('currentTask')[0]

const getCurrentTask = createSelector(
  [getStateCurrentTask],
  (currentTask: TaskProps | undefined) => currentTask
)

const getStateDebugMode = (state: ReduxState): boolean =>
  state.uiState.get('debugMode')

const getDebugMode = createSelector(
  [getStateDebugMode],
  (debugMode: boolean) => debugMode
)

const getStateAttestationStatusCycle = (state: ReduxState): number =>
  state.uiState.get('attestationStatusCycle')

const getAttestationStatusCycle = createSelector(
  [getStateAttestationStatusCycle],
  (cycle: number) => cycle
)

export {
  Store,
  getNotifications,
  getBlockUis,
  getBlockingNotifications,
  getCurrentTask,
  getDebugMode,
  getAttestationStatusCycle,
}
