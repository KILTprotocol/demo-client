import moment from 'moment'
import React, { ReactNode } from 'react'

class BaseUtilities {
  public static getDateTime(timestamp: number | undefined): ReactNode {
    return timestamp ? (
      <span className="date-time">
        {moment(timestamp).format('L')}
        <small>{moment(timestamp).format('HH:mm:ss')}</small>
      </span>
    ) : (
      <span>-</span>
    )
  }
}

export default BaseUtilities
