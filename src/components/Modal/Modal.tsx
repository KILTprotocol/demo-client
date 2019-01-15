import * as React from 'react'

import './Modal.scss'

type Props = {
  type: 'alert' | 'confirm' | 'blank'
  header: string
  preventCloseOnCancel?: boolean
  preventCloseOnConfirm?: boolean
  onCancel?: () => void
  onConfirm?: () => void
  catchBackdropClick?: boolean
}

type State = {
  show: boolean
}

class Modal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      show: false,
    }
    this.handleCancel = this.handleCancel.bind(this)
    this.handleConfirm = this.handleConfirm.bind(this)
    this.handleBackdropClick = this.handleBackdropClick.bind(this)
  }

  public render() {
    const { type, children, header } = this.props
    const { show } = this.state

    const classes = ['Modal', type]

    return (
      show && (
        <section className={classes.join(' ')}>
          <div className="backdrop" onClick={this.handleBackdropClick} />
          <div className="container">
            <header>{header}</header>
            <div className="body">{children}</div>
            {type !== 'blank' && (
              <footer>
                {type === 'confirm' && (
                  <button className="cancel" onClick={this.handleCancel}>
                    Cancel
                  </button>
                )}
                <button className="confirm" onClick={this.handleConfirm}>
                  OK
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
        case 'alert':
          this.handleConfirm()
          break
        case 'confirm':
        case 'blank':
          this.handleCancel()
          break
      }
    }
  }
}

export default Modal
