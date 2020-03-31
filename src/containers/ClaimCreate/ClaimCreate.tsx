import * as sdk from '@kiltprotocol/sdk-js'
import React, { Component } from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'

import MyClaimCreateView from '../../components/MyClaimCreateView/MyClaimCreateView'

type Props = RouteComponentProps<{
  cTypeHash: sdk.ICType['hash']
}>

class ClaimCreate extends Component<Props> {
  constructor(props: Props) {
    super(props)
    this.claimCreated = this.claimCreated.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
  }

  private claimCreated(): void {
    const { history } = this.props
    history.push('/claim')
  }

  private handleCancel(): void {
    const { history } = this.props
    history.push('/claim')
  }

  public render(): '' | JSX.Element {
    const { match } = this.props
    const { cTypeHash } = match.params

    return (
      cTypeHash && (
        <MyClaimCreateView
          partialClaim={{ cTypeHash }}
          onCreate={this.claimCreated}
          onCancel={this.handleCancel}
        />
      )
    )
  }
}

export default withRouter(ClaimCreate)
