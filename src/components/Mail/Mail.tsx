import { ReactNode } from 'react'
import * as React from 'react'

const convert = (string: string) => {
  return string.split('').reduce(
    (accumulated: ReactNode, char) => (
      <span>
        {accumulated}
        {char}
      </span>
    ),
    <span />
  )
}

type Props = {
  mail: string

  mailTo?: boolean
}

const Mail = (props: Props) => {
  const { mail, mailTo } = props

  const handleMailTo = () => {
    location.href = `mailto:${mail}`
  }
  return (
    <span
      className={`eml ${mailTo !== false ? 'linked' : ''}`}
      onClick={handleMailTo}
    >
      <span>{convert(mail)}</span>
    </span>
  )
}

export default Mail
