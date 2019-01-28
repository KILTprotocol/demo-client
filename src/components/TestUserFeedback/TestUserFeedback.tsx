import * as React from 'react'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import * as Claims from '../../state/ducks/Claims'
import { BlockUi, NotificationType } from '../../types/UserFeedback'

type Props = {
  claimStore: Claims.Entry[]
  onRemoveClaim: (hash: string) => void
  onRequestAttestation: (hash: string) => void
}

type State = {
  notificationMessage: string
}

class TestUserFeedback extends React.Component<Props, State> {
  private notificationTimeout: any

  constructor(props: Props) {
    super(props)
    this.state = {
      notificationMessage: '',
    }
    this.testNeutral = this.testNeutral.bind(this)
  }

  public render() {
    return (
      <section className="TestUserFeedBack">
        <button onClick={this.testBlockUi}>Test BlockUi</button>
        <br />
        <button onClick={this.testBlockingFailure}>
          Test Blocking 'Failure' Modal
        </button>
        <button onClick={this.testBlockingSuccess}>
          Test Blocking 'Success' Modal
        </button>
        <button onClick={this.testBlockingNeutral}>
          Test Blocking 'Neutral' Modal
        </button>
        <br />
        <button onClick={this.testFailure}>Test 'Failure' Notification</button>
        <button onClick={this.testSuccess}>Test 'Success' Notification</button>
        <button onClick={this.testNeutral}>Test 'Neutral' Notification</button>
      </section>
    )
  }

  private testBlockUi() {
    let bu1: BlockUi
    let bu2: BlockUi

    bu1 = FeedbackService.addBlockUi({
      headline: 'UI blocked by Process A',
      message: 'doing something (1/2)',
    })

    setTimeout(() => {
      bu2 = FeedbackService.addBlockUi({ headline: 'UI blocked by Process B' })
    }, 2000)

    setTimeout(() => {
      if (bu1.updateMessage) {
        bu1.updateMessage(
          'Very long block ui message to \ndemonstrate the possibility to \nmanually break lines (2/2)'
        )
      }
    }, 4000)

    setTimeout(() => {
      if (bu2.remove) {
        bu2.remove()
      }
    }, 6000)

    setTimeout(() => {
      if (bu1.remove) {
        bu1.remove()
      }
    }, 8000)
  }

  private testBlockingFailure() {
    FeedbackService.addBlockingNotification({ message: 'Example for Failure' })
  }

  private testBlockingSuccess() {
    FeedbackService.addBlockingNotification({
      message: 'Example for Success',
      type: NotificationType.SUCCESS,
    })
  }

  private testBlockingNeutral() {
    FeedbackService.addBlockingNotification({
      message: 'Example for Info',
      type: NotificationType.INFO,
    })
  }

  private testFailure() {
    FeedbackService.addNotification({
      message: 'Example for Failure',
      type: NotificationType.FAILURE,
    })
  }

  private testSuccess() {
    notifySuccess('Example for Success')
  }

  private testNeutral() {
    const { notificationMessage } = this.state
    const _notificationMessage = notificationMessage + 'Example for Info '
    FeedbackService.addNotification({ message: _notificationMessage })

    this.setState({ notificationMessage: _notificationMessage })

    clearTimeout(this.notificationTimeout)
    this.notificationTimeout = setTimeout(() => {
      this.setState({ notificationMessage: '' })
    }, 3000)
  }
}

export default TestUserFeedback
