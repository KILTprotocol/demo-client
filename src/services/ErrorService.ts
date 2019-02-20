import { Notification, NotificationType } from '../types/UserFeedback'
import FeedbackService from './FeedbackService'

export type ErrorType =
  | 'ERROR.FETCH.DELETE'
  | 'ERROR.FETCH.GET'
  | 'ERROR.FETCH.POST'
  | 'ERROR.JSON.PARSE'
  | 'ERROR.BLOCKCHAIN'
  | 'ERROR.UNCLASSIFIED'

type QualifiedError = {
  error: Error
  message: string
  onConfirm?: () => void
  type?: ErrorType
  origin: string
}

type ErrorConfig = {
  blocking?: boolean
  consoleLog?: boolean
}

class ErrorService {
  private static consoleLog({ error, message, origin, type }: QualifiedError) {
    console.groupCollapsed(
      `%c${type} @ ${origin}`,
      'background: red; color: white; padding: 5px;'
    )
    console.error(message)
    console.error(error)
    console.groupEnd()
  }

  private errors: QualifiedError[] = []

  public log(
    { error, message, onConfirm, origin, type }: QualifiedError,
    config?: ErrorConfig
  ) {
    const useConfig = {
      ...{
        blocking: true,
        consoleLog: true,
      },
      ...config,
    }

    // create console output if not suppressed
    if (useConfig.consoleLog) {
      ErrorService.consoleLog({
        error,
        message,
        origin,
        type: type || 'ERROR.UNCLASSIFIED',
      })
    }

    // store for bulk logging
    this.errors.push({
      error,
      message,
      origin,
      type: type || 'ERROR.UNCLASSIFIED',
    })
  }

  public logWithNotification(
    { error, message, onConfirm, origin, type }: QualifiedError,
    config?: ErrorConfig
  ) {
    this.log({ error, message, onConfirm, origin, type }, config)

    const useConfig = {
      ...{
        blocking: true,
        consoleLog: true,
      },
      ...config,
    }

    const notification: Partial<Notification> = {
      className: useConfig.consoleLog ? 'console-log' : '',
      message,
      type: NotificationType.FAILURE,
    }

    // create user feedback
    return useConfig.blocking
      ? FeedbackService.addBlockingNotification({
          ...notification,
          onConfirm,
        })
      : FeedbackService.addNotification(notification)
  }
}

export default new ErrorService()
