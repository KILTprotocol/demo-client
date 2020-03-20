import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import { INotification, NotificationType } from '../../types/UserFeedback'

import './Notifications.scss'

type StateProps = {
  notifications: INotification[]
}
type Props = StateProps

class Notifications extends Component<Props> {
  private static getNotification(
    notification: INotification
  ): '' | JSX.Element {
    const now = Date.now()
    if (now - notification.created >= Notifications.DISPLAY_TIME) {
      if (notification.remove) {
        // prevent update while rendering
        setTimeout(() => {
          notification.remove()
        })
      }
      return ''
    }

    setTimeout(() => {
      if (notification.remove) {
        notification.remove()
      }
    }, Notifications.DISPLAY_TIME)

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
        <button type="button" onClick={notification.remove} className="close" />
      </div>
    )
  }

  private static readonly DISPLAY_TIME = 4000 // ms

  public render(): JSX.Element {
    const { notifications } = this.props
    return (
      <section className="Notifications">
        {notifications.map((notification: INotification) =>
          Notifications.getNotification(notification)
        )}
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  notifications: UiState.getNotifications(state),
})

export default connect(mapStateToProps)(Notifications)
