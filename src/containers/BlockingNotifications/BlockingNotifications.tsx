import React, { Component } from 'react'
import { connect } from 'react-redux'
import Modal, { ModalType } from '../../components/Modal/Modal'

import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import { BlockingNotification } from '../../types/UserFeedback'

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
        header={notification.header || notification.type}
        onConfirm={this.onConfirm(notification)}
        onCancel={this.onCancel(notification)}
        preventCloseOnCancel={true}
        preventCloseOnConfirm={true}
        showOnInit={true}
        type={notification.modalType || ModalType.ALERT}
        okButtonLabel={notification.okButtonLabel}
        cancelButtonLabel={notification.cancelButtonLabel}
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

  private onCancel = (notification: BlockingNotification) => () => {
    if (notification.onCancel) {
      notification.onCancel(notification)
    } else if (notification.remove) {
      notification.remove()
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  notifications: UiState.getBlockingNotifications(state),
})

export default connect(mapStateToProps)(BlockingNotifications)
