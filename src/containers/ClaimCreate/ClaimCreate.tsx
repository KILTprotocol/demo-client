import * as sdk from '@kiltprotocol/prototype-sdk'
import React, { Component } from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'

import ClaimCreateView from '../../components/ClaimCreateView/ClaimCreateView'

type Props = RouteComponentProps<{
  cTypeHash: sdk.ICType['hash']
}> & {}

type State = {}

class ClaimCreate extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.claimCreated = this.claimCreated.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
  }

  public render() {
    const { cTypeHash } = this.props.match.params

    return (
      cTypeHash && (
        <ClaimCreateView
          partialClaim={{ cType: cTypeHash }}
          onCreate={this.claimCreated}
          onCancel={this.handleCancel}
        />
      )
    )
  }

  private claimCreated() {
    const { history } = this.props
    history.push('/claim')
  }

  private handleCancel() {
    const { history } = this.props
    history.push('/claim')
  }
}

export default withRouter(ClaimCreate)
