import React, { ReactNode } from 'react'

const convert = (string: string): ReactNode => {
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

const Mail: React.FC<Props> = ({ mail, mailTo }) => {
  const handleMailTo = (): void => {
    window.location.href = `mailto:${mail}`
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
