type Props = {
  condition: boolean
  then: any,
  else?: any
}

const If: React.SFC<Props> = props => {
  if (props.condition) {
    return props.then
  } else if (!!props.else) {
    return props.else
  }
  return null
}

export default If