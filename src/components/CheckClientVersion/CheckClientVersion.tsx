import React from 'react'
import ClientVersionHelper, {
  CheckResult,
} from '../../services/ClientVersionHelper'
import FeedbackService from '../../services/FeedbackService'
import {
  IBlockingNotification,
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
  private static openResetModal(): void {
    FeedbackService.addBlockingNotification({
      header: 'Blockchain mismatch detected',
      message: (
        <div>
          Your client was previously connected to another blockchain, or the
          blockchain it was connected to restarted from scratch.
        </div>
      ),
      modalType: ModalType.CONFIRM,
      okButtonLabel: 'Reset client',
      onCancel: (notification: IBlockingNotification) => notification.remove(),
      onConfirm: (notification: IBlockingNotification) => {
        notification.remove()
        ClientVersionHelper.resetAndReloadClient()
      },
      type: NotificationType.FAILURE,
    })
  }

  private static showLoading(): JSX.Element {
    return (
      <section className="CheckClientVersion">
        <Spinner size={200} color="#ef5a28" strength={10} />
        <Spinner size={200} color="#ef5a28" strength={10} />
        <div className="connecting">Connecting to chain</div>
      </section>
    )
  }

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount(): void {
    ClientVersionHelper
      // This connects to the blockchain
      .clientResetRequired()
      .then((checkResult: CheckResult) => {
        if (checkResult.accountInvalid || checkResult.firstBlockHashChanged) {
          CheckClientVersion.openResetModal()
        } else {
          this.setState({ valid: true })
        }
      })
  }

  public render(): null | JSX.Element {
    const { valid } = this.state
    return valid ? null : CheckClientVersion.showLoading()
  }
}

export default CheckClientVersion
