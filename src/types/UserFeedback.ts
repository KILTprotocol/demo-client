export enum NotificationType {
  SUCCESS = 'Success',
  FAILURE = 'Failure',
}

export type BlockUi = {
  id: string
  headline?: string
  message?: string
  remove: () => void
  updateMessage: (message: string) => void
}

export interface Notification {
  id: string
  message: string
  created: number
  type: NotificationType
  remove: () => void
}

export interface BlockingNotification extends Notification {
  onConfirm?: (notification: BlockingNotification) => void
}
