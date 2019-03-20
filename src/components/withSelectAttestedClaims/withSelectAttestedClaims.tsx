import * as sdk from '@kiltprotocol/prototype-sdk'
import { IPartialClaim } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import * as Claims from '../../state/ducks/Claims'
import { Contact } from '../../types/Contact'
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

    private getExcludedProperties(
      claimEntry: Claims.Entry,
      selectedClaimProperties: string[]
    ): string[] {
      const propertyNames: string[] = Object.keys(claimEntry.claim.contents)
      const excludedProperties = propertyNames.filter(
        (propertyName: string) =>
          selectedClaimProperties.indexOf(propertyName) === -1
      )
      return excludedProperties
    }

    private getAttestedClaims(): sdk.IAttestedClaim[] {
      const { claimSelectionData } = this.state
      const selectedClaimEntryIds = Object.keys(claimSelectionData)
      const attestedClaims: sdk.IAttestedClaim[] = []
      selectedClaimEntryIds.forEach(
        (selectedClaimEntryId: Claims.Entry['id']) => {
          const { claimEntry, state } = claimSelectionData[selectedClaimEntryId]
          state.selectedAttestedClaims.forEach(
            (selectedAttestedClaim: sdk.IAttestedClaim) => {
              attestedClaims.push(
                sdk.AttestedClaim.fromObject(
                  selectedAttestedClaim
                ).createPresentation(
                  this.getExcludedProperties(
                    claimEntry,
                    state.selectedClaimProperties
                  )
                )
              )
            }
          )
        }
      )
      return attestedClaims
    }
  }

  return HOC
}

export default withSelectAttestedClaims
