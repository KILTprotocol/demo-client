import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import AttestationService from '../../services/AttestationService'

import { ClaimSelectionData } from '../SelectAttestedClaims/SelectAttestedClaims'
import { Subtract } from 'utility-types'

export interface InjectedProps {
  workflowStarted: boolean
  claimSelectionData: ClaimSelectionData
  onStartWorkflow: () => void
  onChange: (claimSelectionData: ClaimSelectionData) => void
  getAttestedClaims: () => sdk.IAttestedClaim[]
}

type State = {
  claimSelectionData: ClaimSelectionData
  workflowStarted: boolean
}

const withSelectAttestedClaims = <P extends InjectedProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  type HocProps = Subtract<P, InjectedProps>

  class HOC extends React.Component<HocProps, State> {
    constructor(props: HocProps) {
      super(props)
      this.state = {
        claimSelectionData: {},
        workflowStarted: false,
      }

      this.startWorkflow = this.startWorkflow.bind(this)
      this.changeClaimSelectionData = this.changeClaimSelectionData.bind(this)
      this.getAttestedClaims = this.getAttestedClaims.bind(this)
    }

    public render() {
      const { workflowStarted, claimSelectionData } = this.state

      return (
        <WrappedComponent
          {...this.props as HocProps}
          workflowStarted={workflowStarted}
          claimSelectionData={claimSelectionData}
          onStartWorkflow={this.startWorkflow}
          onChange={this.changeClaimSelectionData}
          getAttestedClaims={this.getAttestedClaims}
        />
      )
    }

    private changeClaimSelectionData(claimSelectionData: ClaimSelectionData) {
      this.setState({ claimSelectionData })
    }

    private startWorkflow() {
      this.setState({
        workflowStarted: true,
      })
    }

    private getAttestedClaims(): sdk.IAttestedClaim[] {
      const { claimSelectionData } = this.state
      return AttestationService.getAttestedClaims(claimSelectionData)
    }
  }

  return HOC
}

export default withSelectAttestedClaims
