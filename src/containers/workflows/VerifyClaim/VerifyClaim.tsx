import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'

import AttestedClaimsListView from 'src/components/AttestedClaimsListView/AttestedClaimsListView'
import attestationService from '../../../services/AttestationService'

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
}

type State = {}

class VerifyClaim extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.onVerifyAttestation = this.onVerifyAttestation.bind(this)
  }

  public render() {
    const { attestedClaims } = this.props
    return (
      <AttestedClaimsListView
        attestedClaims={attestedClaims}
        onVerifyAttestation={this.onVerifyAttestation}
      />
    )
  }

  private async onVerifyAttestation(
    attestation: sdk.IAttestedClaim
  ): Promise<boolean> {
    return attestationService.verifyAttestatedClaim(attestation)
  }
}

export default VerifyClaim
