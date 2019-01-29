import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import ClaimDetailView from 'src/components/ClaimDetailView/ClaimDetailView'
import attestationService from '../../../services/AttestationService'

type Props = {
  claim: sdk.IClaim
  attestations: sdk.IAttestation[]
}

type State = {}

class VerifyClaim extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.onVerifyAttestation = this.onVerifyAttestation.bind(this)
  }

  public render() {
    const { claim, attestations } = this.props
    const claimEntry = {
      attestations,
      claim: sdk.Claim.fromObject(claim),
    }
    return (
      <ClaimDetailView
        claimEntry={claimEntry}
        onVerifyAttestation={this.onVerifyAttestation}
      />
    )
  }

  private async onVerifyAttestation(
    attestation: sdk.Attestation
  ): Promise<boolean> {
    return attestationService.verifyAttestation(attestation)
  }
}

export default VerifyClaim
