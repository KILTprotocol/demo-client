import * as sdk from '@kiltprotocol/sdk-js'
import * as React from 'react'
import AttestationService from '../../services/AttestationService'

import { ClaimSelectionData } from '../SelectAttestedClaims/SelectAttestedClaims'
import { Subtract } from 'utility-types'

export interface InjectedProps {
  claimSelectionData: ClaimSelectionData
  getAttestedClaims: () => sdk.IAttestedClaim[]
  onChange: (claimSelectionData: ClaimSelectionData) => void
}

type State = {
  claimSelectionData: ClaimSelectionData
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
      }

      this.changeClaimSelectionData = this.changeClaimSelectionData.bind(this)
      this.getAttestedClaims = this.getAttestedClaims.bind(this)
    }

    public render() {
      const { claimSelectionData } = this.state

      return (
        <WrappedComponent
          {...this.props as HocProps}
          claimSelectionData={claimSelectionData}
          onChange={this.changeClaimSelectionData}
          getAttestedClaims={this.getAttestedClaims}
        />
      )
    }

    private changeClaimSelectionData(claimSelectionData: ClaimSelectionData) {
      this.setState({ claimSelectionData })
    }

    private getAttestedClaims(): sdk.IAttestedClaim[] {
      const { claimSelectionData } = this.state
      return AttestationService.getAttestedClaims(claimSelectionData)
    }
  }

  return HOC
}

export default withSelectAttestedClaims
