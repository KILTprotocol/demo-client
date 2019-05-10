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
  localPart: string
  domain: string
  topLevelDomain: string
}

const Mail = (props: Props) => {
  const { localPart, domain, topLevelDomain } = props
  const mailTo = () => {
    location.href = `mailto:${localPart}@${domain}.${topLevelDomain}`
  }
  return (
    <span className="eml" onClick={mailTo}>
      <span>{convert(localPart)}</span>
      <span>@</span>
      <span>{convert(domain)}</span>
      <span>.</span>
      <span>{convert(topLevelDomain)}</span>
    </span>
  )
}

export default Mail
