import * as React from 'react'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import * as Claims from '../../state/ducks/Claims'
import { BlockUi, NotificationType } from '../../types/UserFeedback'

type Props = {}

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
        <h2>Test User Feedback</h2>

        <h4>Block UI</h4>
        <button onClick={this.testBlockUi}>Test</button>

        <h4>Blocking Modals</h4>
        <button onClick={this.testBlockingFailure}>Failure</button>
        <button onClick={this.testBlockingSuccess}>Success</button>
        <button onClick={this.testBlockingNeutral}>Neutral</button>

        <h4>Notifications</h4>
        <button onClick={this.testFailure}>Failure</button>
        <button onClick={this.testSuccess}>Success</button>
        <button onClick={this.testNeutral}>Neutral</button>
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
