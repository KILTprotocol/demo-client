import * as React from 'react'
import { ChangeEvent } from 'react'

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
  public static defaultProps = {
    type: 'text',
  }

  private inputElement: HTMLInputElement | null

  public componentDidMount() {
    const { autoFocus } = this.props

    if (autoFocus && this.inputElement) {
      this.inputElement.focus()
    }
  }

  public render() {
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
        const props = { ...baseProps, min, max }
        return <input {...props} />
      default:
        return <input {...baseProps} />
    }
  }

  private onKeyUp(event: React.KeyboardEvent<HTMLInputElement>) {
    const { onSubmit } = this.props

    if (onSubmit && event.keyCode === 13) {
      onSubmit()
    }
  }
}

export default Input
