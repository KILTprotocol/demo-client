import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { Subtract } from 'utility-types'

import AttestationService from '../../services/AttestationService'
import { ClaimSelectionData } from '../SelectAttestedClaims/SelectAttestedClaims'

export interface IInjectedProps {
  claimSelectionData: ClaimSelectionData
  getAttestedClaims: () => sdk.IAttestedClaim[]
  onChange: (claimSelectionData: ClaimSelectionData) => void
}

type State = {
  claimSelectionData: ClaimSelectionData
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const withSelectAttestedClaims = <P extends IInjectedProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  type HocProps = Subtract<P, IInjectedProps>

  class HOC extends React.Component<HocProps, State> {
    constructor(props: HocProps) {
      super(props)
      this.state = {
        claimSelectionData: {},
      }

      this.changeClaimSelectionData = this.changeClaimSelectionData.bind(this)
      this.getAttestedClaims = this.getAttestedClaims.bind(this)
    }

    private getAttestedClaims(): sdk.IAttestedClaim[] {
      const { claimSelectionData } = this.state
      return AttestationService.getAttestedClaims(claimSelectionData)
    }

    private changeClaimSelectionData(
      claimSelectionData: ClaimSelectionData
    ): void {
      this.setState({ claimSelectionData })
    }

    public render(): JSX.Element {
      const { claimSelectionData } = this.state

      return (
        <WrappedComponent
          {...(this.props as P)}
          claimSelectionData={claimSelectionData}
          onChange={this.changeClaimSelectionData}
          getAttestedClaims={this.getAttestedClaims}
        />
      )
    }
  }

  return HOC
}

export default withSelectAttestedClaims
