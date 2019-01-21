import React, { Component } from 'react'
import { connect } from 'react-redux'

import * as UiState from '../../state/ducks/UiState'
import { Notification } from '../../types/UserFeedback'

import './Notifications.scss'

type Props = {
  notifications: Notification[]
}

type State = {}

class Notifications extends Component<Props, State> {
  private displayTime = 3000 // ms

  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { notifications } = this.props
    return (
      <section className="Notifications">
        {notifications.map((notification: Notification) =>
          this.getNotification(notification)
        )}
      </section>
    )
  }

  private getNotification(notification: Notification) {
    const now = Date.now()
    if (now - notification.created >= this.displayTime) {
      if (notification.remove) {
        notification.remove()
      }
    } else {
      setTimeout(() => {
        if (notification.remove) {
          notification.remove()
        }
      }, this.displayTime)
    }

    return (
      <div
        key={notification.id}
        className={['notification', notification.type].join(' ')}
      >
        <header>{notification.type}</header>
        <div className="body">{notification.message}</div>
      </div>
    )
  }
}

const mapStateToProps = (state: { uiState: UiState.ImmutableState }) => {
  return {
    notifications: state.uiState
      .get('notifications')
      .toList()
      .toArray(),
  }
}

export default connect(mapStateToProps)(Notifications)
