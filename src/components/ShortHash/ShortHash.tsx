import * as React from 'react'

const defaultLength = 10

type Props = {
  length?: number
}

type State = {}

class ShortHash extends React.Component<Props, State> {
  public render() {
    const { children, length } = this.props

    const _length: number = length || defaultLength

    return (
      <span className="short-hash" title={children as string}>
        {(children as string).substr(0, _length)}&hellip;
      </span>
    )
  }
}

export default ShortHash
