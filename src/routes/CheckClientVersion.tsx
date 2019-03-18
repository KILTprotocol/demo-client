import * as React from 'react'

import { ModalType } from '../components/Modal/Modal'
import { BlockingNotification, NotificationType } from '../types/UserFeedback'
import {
  CheckResult,
  clientVersionHelper,
} from '../services/ClientVersionHelper'
import FeedbackService from '../services/FeedbackService'

const openResetModal = () => {
  FeedbackService.addBlockingNotification({
    header: 'Client version mismatch detected',
    message: (
      <div>
        Your client version differs from the current blockchain version.
      </div>
    ),
    modalType: ModalType.CONFIRM,
    okButtonLabel: 'Reset client',
    onCancel: (notification: BlockingNotification) => notification.remove(),
    onConfirm: (notification: BlockingNotification) => {
      notification.remove()
      clientVersionHelper.resetAndReloadClient()
    },
    type: NotificationType.FAILURE,
  })
}

const CheckClientVersion: React.FunctionComponent<{}> = props => {
  clientVersionHelper.clientResetRequired().then((checkResult: CheckResult) => {
    if (checkResult.accountInvalid || checkResult.versionMismatch) {
      openResetModal()
    }
  })

  return <React.Fragment />
}

export default CheckClientVersion
