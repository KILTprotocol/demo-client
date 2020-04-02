import React from 'react'

type Props = {
  condition: boolean
  then: JSX.Element
  else?: JSX.Element
}

const If: React.FC<Props> = ({ condition, else: propsElse, then }) => {
  if (condition) {
    return then
  }

  if (propsElse) {
    return propsElse
  }

  return null
}

export default If
