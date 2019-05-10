import * as React from 'react'
import {
  CheckResult,
  clientVersionHelper,
} from '../../services/ClientVersionHelper'
import FeedbackService from '../../services/FeedbackService'
import {
  BlockingNotification,
  NotificationType,
} from '../../types/UserFeedback'

import { ModalType } from '../Modal/Modal'
import Spinner from '../Spinner/Spinner'

import './CheckClientVersion.scss'

type Props = {}
type State = {
  valid?: boolean
}

class CheckClientVersion extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    clientVersionHelper
      // This connects to the blockchain
      .clientResetRequired()
      .then((checkResult: CheckResult) => {
        if (checkResult.accountInvalid || checkResult.versionMismatch) {
          this.openResetModal()
        } else {
          this.setState({ valid: true })
        }
      })
  }

  public render() {
    const { valid } = this.state
    return valid ? '' : this.showLoading()
  }

  private showLoading() {
    return (
      <section className="CheckClientVersion">
        <Spinner size={200} color="#ef5a28" strength={10} />
        <Spinner size={200} color="#ef5a28" strength={10} />
        <div className="connecting">Connecting to chain</div>
      </section>
    )
  }

  private openResetModal() {
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
}

export default CheckClientVersion
