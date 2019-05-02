import * as React from 'react'
import { ReactNode } from 'react'

import './Modal.scss'

export enum ModalType {
  ALERT = 'alert',
  CONFIRM = 'confirm',
  BLANK = 'blank',
}

type Props = {
  catchBackdropClick?: boolean
  className?: string
  header: string | ReactNode
  onCancel?: () => void
  onConfirm?: () => void
  preventCloseOnCancel?: boolean
  preventCloseOnConfirm?: boolean
  showOnInit?: boolean
  type: ModalType
  okButtonLabel?: string
  cancelButtonLabel?: string
}

type State = {
  show: boolean
}

class Modal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      show: !!props.showOnInit,
    }
    this.handleCancel = this.handleCancel.bind(this)
    this.handleConfirm = this.handleConfirm.bind(this)
    this.handleBackdropClick = this.handleBackdropClick.bind(this)
  }

  public render() {
    const {
      className,
      children,
      header,
      type,
      okButtonLabel,
      cancelButtonLabel,
    } = this.props
    const { show } = this.state

    const classes = ['Modal', className, type]

    return (
      show && (
        <section className={classes.join(' ')}>
          <div className="backdrop" onClick={this.handleBackdropClick} />
          <div className="container">
            <header>
              {header}
              <button className="close" onClick={this.handleCancel} />
            </header>
            <div className="body">{children}</div>
            {type !== ModalType.BLANK && (
              <footer>
                {type === ModalType.CONFIRM && (
                  <button className="cancel" onClick={this.handleCancel}>
                    {cancelButtonLabel == null ? 'Cancel' : cancelButtonLabel}
                  </button>
                )}
                <button className="confirm" onClick={this.handleConfirm}>
                  {okButtonLabel == null ? 'OK' : okButtonLabel}
                </button>
              </footer>
            )}
          </div>
        </section>
      )
    )
  }

  public show() {
    this.setState({ show: true })
  }

  public hide() {
    this.setState({ show: false })
  }

  public toggle() {
    const { show } = this.state
    this.setState({ show: !show })
  }

  private handleCancel() {
    const { onCancel, preventCloseOnCancel } = this.props
    if (onCancel) {
      onCancel()
    }
    if (!preventCloseOnCancel) {
      this.hide()
    }
  }

  private handleConfirm() {
    const { onConfirm, preventCloseOnConfirm } = this.props
    if (onConfirm) {
      onConfirm()
    }
    if (!preventCloseOnConfirm) {
      this.hide()
    }
  }

  private handleBackdropClick() {
    const { type, catchBackdropClick } = this.props
    if (!catchBackdropClick) {
      switch (type) {
        case ModalType.ALERT:
          this.handleConfirm()
          break
        default:
          // ModalType.BLANK
          // ModalType.CONFIRM
          this.handleCancel()
      }
    }
  }
}

export default Modal
