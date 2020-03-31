import { IMessage } from '@kiltprotocol/sdk-js'
import React from 'react'

import './MessageSubject.scss'

type Props = {
  message: IMessage
}

const MessageSubject: React.FC<Props> = ({ message }) => {
  if (!message || !message.body || !message.body.content) {
    return <span className="MessageSubject">-</span>
  }

  if (!message.body || !message.body.type) {
    return <span className="MessageSubject">{message.body}</span>
  }

  return (
    <span className="MessageSubject">
      <span className="type">{message.body.type}</span>
    </span>
  )
}

export default MessageSubject
