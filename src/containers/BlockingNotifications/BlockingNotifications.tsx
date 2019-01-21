import React, { Component } from 'react'
import { connect } from 'react-redux'
import Modal from '../../components/Modal/Modal'

import * as UiState from '../../state/ducks/UiState'
import { BlockingNotification } from '../../types/UserFeedback'

type Props = {
  notifications: BlockingNotification[]
}

type State = {}

class BlockingNotifications extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { notifications } = this.props
    return (
      <section className="BlockingNotifications">
        {notifications.map((notification: BlockingNotification) =>
          this.getModal(notification)
        )}
      </section>
    )
  }

  private getModal(notification: BlockingNotification) {
    return (
      <Modal
        key={notification.id}
        showOnInit={true}
        header={notification.type}
        type="alert"
        preventCloseOnCancel={true}
        preventCloseOnConfirm={true}
        onConfirm={this.onConfirm(notification)}
      >
        {notification.message}
      </Modal>
    )
  }

  private onConfirm = (notification: BlockingNotification) => () => {
    if (notification.onConfirm) {
      notification.onConfirm(notification)
    } else if (notification.remove) {
      notification.remove()
    }
  }
}

const mapStateToProps = (state: { uiState: UiState.ImmutableState }) => {
  return {
    notifications: state.uiState
      .get('blockingNotifications')
      .toList()
      .toArray(),
  }
}

export default connect(mapStateToProps)(BlockingNotifications)
