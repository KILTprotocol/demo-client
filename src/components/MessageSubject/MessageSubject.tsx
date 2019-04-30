import {
  IMessage,
  IRequestAttestationForClaim,
  IRequestClaimsForCtype,
  IRequestLegitimations,
  ISubmitAttestationForClaim,
  ISubmitClaimsForCtype,
  ISubmitLegitimations,
  MessageBodyType,
} from '@kiltprotocol/prototype-sdk'
import { ReactNode } from 'react'
import * as React from 'react'

import './MessageSubject.scss'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

type Props = {
  message: IMessage
}

const MessageSubject = (props: Props) => {
  const { message } = props
  if (!message || !message.body || !message.body.content) {
    return <span className="MessageSubject">-</span>
  }

  if (!message.body || !message.body.type) {
    return <span className="MessageSubject">{message.body}</span>
  }

  return (
    <span className="MessageSubject">
      <span className="type">{message.body!.type}</span>
    </span>
  )
}

export default MessageSubject
