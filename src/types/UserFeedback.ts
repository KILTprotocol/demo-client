import { ReactNode } from 'react'
import { ModalType } from '../components/Modal/Modal'

export enum NotificationType {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  INFO = 'INFO',
}

export type BlockUi = {
  created: number
  id: string
  headline?: string
  message?: string
  remove: () => void
  updateMessage: (message: string) => void
}

export interface INotification {
  id: string
  className?: string
  created: number
  message: string | ReactNode
  remove: () => void
  type: NotificationType
}

export interface IBlockingNotification extends INotification {
  header?: string
  modalType?: ModalType
  onConfirm?: (notification: IBlockingNotification) => void
  onCancel?: (notification: IBlockingNotification) => void
  okButtonLabel?: string
  cancelButtonLabel?: string
}
