import React, { ChangeEvent } from 'react'

type Props = {
  autoFocus?: boolean
  type?: 'text' | 'number'
  id?: string
  name?: string
  min?: number
  max?: number
  className?: string
  value?: string | number
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit?: () => void
}

type State = {}

class Input extends React.Component<Props, State> {
  private inputElement: HTMLInputElement | null

  public static defaultProps = {
    type: 'text',
  }

  public componentDidMount(): void {
    const { autoFocus } = this.props

    if (autoFocus && this.inputElement) {
      this.inputElement.focus()
    }
  }

  private onKeyUp(event: React.KeyboardEvent<HTMLInputElement>): void {
    const { onSubmit } = this.props

    if (onSubmit && event.keyCode === 13) {
      onSubmit()
    }
  }

  public render(): JSX.Element {
    const {
      className,
      id,
      name,
      min,
      max,
      onChange,
      onSubmit,
      type,
      value,
    } = this.props

    let onKeyUp
    if (onSubmit) {
      onKeyUp = this.onKeyUp.bind(this)
    }

    const baseProps = {
      className,
      id,
      name,
      onChange,
      onKeyUp,
      ref: (input: HTMLInputElement) => {
        this.inputElement = input
      },
      type,
      value,
    }

    switch (type) {
      case 'number':
        return <input {...baseProps} min={min} max={max} />
      default:
        return <input {...baseProps} />
    }
  }
}

export default Input
