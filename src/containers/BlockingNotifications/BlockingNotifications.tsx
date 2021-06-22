import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import Modal, { ModalType } from '../../components/Modal/Modal'

import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import { IBlockingNotification } from '../../types/UserFeedback'

import './BlockingNotifications.scss'

type StateProps = {
  notifications: IBlockingNotification[]
}

type Props = StateProps

class BlockingNotifications extends Component<Props> {
  private getModal(notification: IBlockingNotification): JSX.Element {
    return (
      <Modal
        key={notification.id}
        className={[notification.className, notification.type, 'small'].join(
          ' '
        )}
        header={notification.header || notification.type}
        onConfirm={this.onConfirm(notification)}
        onCancel={this.onCancel(notification)}
        preventCloseOnCancel
        preventCloseOnConfirm
        showOnInit
        type={notification.modalType || ModalType.ALERT}
        okButtonLabel={notification.okButtonLabel}
        cancelButtonLabel={notification.cancelButtonLabel}
      >
        {notification.message}
        <div className="console-log">( for details refer to console )</div>
      </Modal>
    )
  }

  private onConfirm = (notification: IBlockingNotification) => () => {
    if (notification.onConfirm) {
      notification.onConfirm(notification)
    } else if (notification.remove) {
      notification.remove()
    }
  }

  private onCancel = (notification: IBlockingNotification) => () => {
    if (notification.onCancel) {
      notification.onCancel(notification)
    } else if (notification.remove) {
      notification.remove()
    }
  }

  public render(): JSX.Element {
    const { notifications } = this.props
    return (
      <section className="BlockingNotifications">
        {notifications.map((notification: IBlockingNotification) =>
          this.getModal(notification)
        )}
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = (
  state
) => ({
  notifications: UiState.getBlockingNotifications(state),
})

export default connect(mapStateToProps)(BlockingNotifications)
