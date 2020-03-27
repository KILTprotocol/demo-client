import React from 'react'

const DEFAULT_LENGTH = 10

type Props = {
  children: string
  length?: number
}

const ShortHash: React.FC<Props> = ({ children, length }) => {
  return (
    <span className="short-hash" title={children}>
      {children.substr(0, length || DEFAULT_LENGTH)}&hellip;
    </span>
  )
}

export default ShortHash
