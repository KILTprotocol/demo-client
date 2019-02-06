import React, { Component } from 'react'
import { connect } from 'react-redux'

import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import { Notification, NotificationType } from '../../types/UserFeedback'

import './Notifications.scss'

type Props = {
  notifications: Notification[]
}

type State = {}

class Notifications extends Component<Props, State> {
  private static readonly DISPLAY_TIME = 4000 // ms

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
    if (now - notification.created >= Notifications.DISPLAY_TIME) {
      if (notification.remove) {
        notification.remove()
      }
    } else {
      setTimeout(() => {
        if (notification.remove) {
          notification.remove()
        }
      }, Notifications.DISPLAY_TIME)
    }

    return (
      <div
        key={notification.id}
        className={[
          'notification',
          notification.type,
          notification.className,
        ].join(' ')}
      >
        {notification.type !== NotificationType.INFO && (
          <header>{notification.type}</header>
        )}
        <div className="body">
          {notification.message}
          <div className="console-log">( for details refer to console )</div>
        </div>
        <button onClick={notification.remove} className="close" />
      </div>
    )
  }
}

const mapStateToProps = (state: ReduxState) => ({
  notifications: UiState.getNotifications(state),
})

export default connect(mapStateToProps)(Notifications)
