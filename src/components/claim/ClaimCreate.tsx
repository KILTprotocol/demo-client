import React, { Component } from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'

type Props = RouteComponentProps<{
  ctypeKey: string
}>

class ClaimCreate extends Component<Props, {}> {
  public render() {
    const { match } = this.props

    return <h1>Hello World: {match.params.ctypeKey}</h1>
  }
}

export default withRouter(ClaimCreate)
