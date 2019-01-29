import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'

import ClaimDetailView from 'src/components/ClaimDetailView/ClaimDetailView'
import * as Claims from '../../../state/ducks/Claims'
import attestationService from '../../../services/AttestationService'

type Props = {
  claim: sdk.IClaim
  attestations: sdk.IAttestation[]
}

type State = {
  claimEntry: Claims.Entry
}

class VerifyClaim extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.onVerifyAttestation = this.onVerifyAttestation.bind(this)
    this.onRemoveClaim = this.onRemoveClaim.bind(this)
    this.onRequestAttestation = this.onRequestAttestation.bind(this)
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
        // @ts-ignore
        onRemoveClaim={this.onRemoveClaim}
        // @ts-ignore
        onRequestAttestation={this.onRequestAttestation}
        onVerifyAttestation={this.onVerifyAttestation}
      />
    )
  }

  private async onVerifyAttestation(
    attestation: sdk.Attestation
  ): Promise<boolean> {
    return attestationService.verifyAttestation(attestation)
  }

  private onRemoveClaim(hash: string) {
    // ignore
  }

  private onRequestAttestation(hash: string) {
    // ignore
  }
}

export default VerifyClaim
