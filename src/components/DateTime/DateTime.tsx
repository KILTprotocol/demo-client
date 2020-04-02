import moment from 'moment'
import React from 'react'

type Props = {
  timestamp?: number
  pattern?: string
}

type State = {}

class DateTime extends React.Component<Props, State> {
  private getPattern(): JSX.Element {
    const { timestamp, pattern } = this.props
    return (
      <span className="date-time">{moment(timestamp).format(pattern)}</span>
    )
  }

  private getDefault(): JSX.Element {
    const { timestamp } = this.props
    return (
      <span className="date-time">
        {moment(timestamp).format('L')}
        <small>{moment(timestamp).format('HH:mm:ss')}</small>
      </span>
    )
  }

  private static getNoTimeStamp(): JSX.Element {
    return <span>-</span>
  }

  public render(): JSX.Element {
    const { timestamp, pattern } = this.props

    if (timestamp) {
      if (pattern) {
        return this.getPattern()
      }
      return this.getDefault()
    }
    return DateTime.getNoTimeStamp()
  }
}

export default DateTime
