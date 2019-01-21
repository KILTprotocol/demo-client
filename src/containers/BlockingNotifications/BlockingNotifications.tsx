import React, { Component } from 'react'
import { connect } from 'react-redux'
import Modal from '../../components/Modal/Modal'

import * as UiState from '../../state/ducks/UiState'
import { BlockingNotification, Notification } from '../../types/UserFeedback'

import './BlockingNotifications.scss'

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
        className={[notification.className, notification.type].join(' ')}
        header={notification.type}
        onConfirm={this.onConfirm(notification)}
        preventCloseOnCancel={true}
        preventCloseOnConfirm={true}
        showOnInit={true}
        type="alert"
      >
        {notification.message}
        <div className="console-log">( for details refer to console )</div>
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
      .toArray()
      .sort((a: Notification, b: Notification) => a.created - b.created),
  }
}

export default connect(mapStateToProps)(BlockingNotifications)
