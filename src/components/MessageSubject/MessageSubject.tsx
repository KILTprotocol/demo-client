import * as React from 'react'
import {
  Message,
  MessageBodyType,
  MessageOutput,
  RequestClaimsForCtype,
  RequestLegitimations,
} from '../../types/Message'

import './MessageSubject.scss'

type Props = {
  message: Message
}

const MessageSubject = (props: Props) => {
  const { message } = props
  if (!message || !message.body || !message.body.content) {
    return <span className="MessageSubject">-</span>
  }

  if (!message.body || !message.body.type) {
    return <span className="MessageSubject">{message.message}</span>
  }

  let additionalInfo: string = ''
  try {
    const messageBodyType: MessageBodyType | undefined = message.body.type

    switch (messageBodyType) {
      case MessageBodyType.REQUEST_CLAIMS_FOR_CTYPE:
        additionalInfo = (message.body as RequestClaimsForCtype).content.cType
          .metadata.title.default
        break
      case MessageBodyType.REQUEST_LEGITIMATIONS:
        additionalInfo = (message.body as RequestLegitimations).content.cType
        break
    }
  } catch (error) {
    additionalInfo = ''
  }

  return (
    <span className="MessageSubject">
      <span className="type">{message.body!.type}</span>
      {additionalInfo && <span> "{additionalInfo}"</span>}
    </span>
  )
}

export default MessageSubject
