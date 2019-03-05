import moment from 'moment'
import * as React from 'react'

type Props = {
  timestamp?: number
  pattern?: string
}

type State = {}

class DateTime extends React.Component<Props, State> {
  public render() {
    const { timestamp, pattern } = this.props

    return timestamp
      ? pattern
        ? this.getPattern()
        : this.getDefault()
      : this.getNoTimeStamp()
  }

  private getPattern() {
    const { timestamp, pattern } = this.props
    return (
      <span className="date-time">{moment(timestamp).format(pattern)}</span>
    )
  }

  private getDefault() {
    const { timestamp } = this.props
    return (
      <span className="date-time">
        {moment(timestamp).format('L')}
        <small>{moment(timestamp).format('HH:mm:ss')}</small>
      </span>
    )
  }

  private getNoTimeStamp() {
    return <span>-</span>
  }
}

export default DateTime
