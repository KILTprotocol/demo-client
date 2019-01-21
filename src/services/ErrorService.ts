import { NotificationType } from '../types/UserFeedback'
import FeedbackService from './FeedbackService'

type QualifiedError = {
  error: Error
  message: string
  onConfirm?: () => void
  origin: any
}

class ErrorService {
  private errors: QualifiedError[] = []

  public log(qualifiedError: QualifiedError, blocking = true) {
    const { origin, error, message, onConfirm } = qualifiedError
    console.groupCollapsed(
      '%cERROR @ ' + origin,
      'background: red; color: white; padding: 5px;'
    )
    console.error(message)
    console.error(error)
    console.groupEnd()
    this.errors.push({
      error,
      message,
      origin,
    })
    return blocking
      ? FeedbackService.addBlockingNotification({
          message,
          onConfirm,
          type: NotificationType.FAILURE,
        })
      : FeedbackService.addNotification({
          message,
          type: NotificationType.FAILURE,
        })
  }
}

export default new ErrorService()
