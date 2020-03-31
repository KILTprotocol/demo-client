import React from 'react'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import { BlockUi, NotificationType } from '../../types/UserFeedback'

type Props = {}

type State = {
  notificationMessage: string
}

class TestUserFeedback extends React.Component<Props, State> {
  private static testBlockUi(): void {
    const bu1 = FeedbackService.addBlockUi({
      headline: 'UI blocked by Process A',
      message: 'doing something (1/2)',
    })

    let bu2: BlockUi
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

  private static testBlockingFailure(): void {
    FeedbackService.addBlockingNotification({ message: 'Example for Failure' })
  }

  private static testBlockingSuccess(): void {
    FeedbackService.addBlockingNotification({
      message: 'Example for Success',
      type: NotificationType.SUCCESS,
    })
  }

  private static testBlockingNeutral(): void {
    FeedbackService.addBlockingNotification({
      message: 'Example for Info',
      type: NotificationType.INFO,
    })
  }

  private static testFailure(): void {
    FeedbackService.addNotification({
      message: 'Example for Failure',
      type: NotificationType.FAILURE,
    })
  }

  private static testSuccess(): void {
    notifySuccess('Example for Success')
  }

  private notificationTimeout: number

  constructor(props: Props) {
    super(props)
    this.state = {
      notificationMessage: '',
    }
    this.testNeutral = this.testNeutral.bind(this)
  }

  private testNeutral(): void {
    const { notificationMessage } = this.state
    const newNotificationMessage = `${notificationMessage}Example for Info `
    FeedbackService.addNotification({ message: newNotificationMessage })

    this.setState({ notificationMessage: newNotificationMessage })

    clearTimeout(this.notificationTimeout)
    this.notificationTimeout = window.setTimeout(() => {
      this.setState({ notificationMessage: '' })
    }, 3000)
  }

  public render(): JSX.Element {
    return (
      <section className="TestUserFeedBack">
        <h2>Test User Feedback</h2>

        <h4>Block UI</h4>
        <button type="button" onClick={TestUserFeedback.testBlockUi}>
          Test
        </button>

        <h4>Blocking Modals</h4>
        <button type="button" onClick={TestUserFeedback.testBlockingFailure}>
          Failure
        </button>
        <button type="button" onClick={TestUserFeedback.testBlockingSuccess}>
          Success
        </button>
        <button type="button" onClick={TestUserFeedback.testBlockingNeutral}>
          Neutral
        </button>

        <h4>Notifications</h4>
        <button type="button" onClick={TestUserFeedback.testFailure}>
          Failure
        </button>
        <button type="button" onClick={TestUserFeedback.testSuccess}>
          Success
        </button>
        <button type="button" onClick={this.testNeutral}>
          Neutral
        </button>
      </section>
    )
  }
}

export default TestUserFeedback
