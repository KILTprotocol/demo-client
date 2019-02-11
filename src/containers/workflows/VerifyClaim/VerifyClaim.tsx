import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'

import attestationService from '../../../services/AttestationService'
import AttestedClaimVerificationView from 'src/components/AttestedClaimVerificationView/AttestedClaimVerificationView'
import contactRepository from '../../../services/ContactRepository'
import ctypeRepository from '../../../services/CtypeRepository'
import { Contact } from '../../../types/Contact'
import Spinner from '../../../components/Spinner/Spinner'
import { ICType, CType } from '../../../types/Ctype'

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
}

type State = {
  attestersResolved: boolean
  ctypesResolved: boolean
}

class VerifyClaim extends React.Component<Props, State> {
  private ctypeMap: Map<string, CType>

  constructor(props: Props) {
    super(props)
    this.ctypeMap = new Map()
    this.state = {
      attestersResolved: false,
      ctypesResolved: false,
    }
    this.onVerifyAttestation = this.onVerifyAttestation.bind(this)
  }

  public componentDidMount() {
    const { attestedClaims } = this.props
    contactRepository.findAll().then(() => {
      this.setState({
        attestersResolved: true,
      })
    })
    Promise.all(
      attestedClaims.map((attestedClaim: sdk.IAttestedClaim) => {
        return ctypeRepository.findByKey(attestedClaim.request.claim.ctype)
      })
    ).then((ctypes: ICType[]) => {
      ctypes.forEach((cType: ICType) => {
        this.ctypeMap[cType.key] = CType.fromObject(cType)
      })
      this.setState({
        ctypesResolved: true,
      })
    })
  }

  public render() {
    const { attestedClaims } = this.props
    const { attestersResolved, ctypesResolved } = this.state

    return attestersResolved && ctypesResolved ? (
      <React.Fragment>
        {attestedClaims.map((attestedClaim: sdk.IAttestedClaim) => {
          return (
            <AttestedClaimVerificationView
              key={attestedClaim.attestation.claimHash}
              attestedClaim={attestedClaim}
              ctype={this.ctypeMap[attestedClaim.request.claim.ctype]}
              attester={this.getAttester(attestedClaim.attestation.owner)}
              onVerifyAttestatedClaim={this.onVerifyAttestation}
            />
          )
        })}
      </React.Fragment>
    ) : (
      <Spinner size={20} color="#ef5a28" strength={3} />
    )
  }

  private getAttester(
    attesterAddress: Contact['publicIdentity']['address']
  ): Contact | undefined {
    return contactRepository.findByAddress(attesterAddress)
  }

  private async onVerifyAttestation(
    attestation: sdk.IAttestedClaim
  ): Promise<boolean> {
    return attestationService.verifyAttestatedClaim(attestation)
  }
}

export default VerifyClaim
