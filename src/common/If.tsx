import * as React from 'react'

type Props = {
  condition: boolean
  then: any
  else?: any
}

const If: React.FunctionComponent<Props> = props => {
  if (props.condition) {
    return props.then
  }

  if (!!props.else) {
    return props.else
  }

  return null
}

export default If
