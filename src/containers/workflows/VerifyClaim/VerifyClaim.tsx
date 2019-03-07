import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import AttestedClaimVerificationView from 'src/components/AttestedClaimVerificationView/AttestedClaimVerificationView'
import AttestedClaimsListView
  from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import Spinner from '../../../components/Spinner/Spinner'

import attestationService from '../../../services/AttestationService'
import contactRepository from '../../../services/ContactRepository'
import CTypeRepository from '../../../services/CtypeRepository'
import { CType, ICType } from '../../../types/Ctype'

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
  context?: 'legitimation'
}

type State = {
  attestersResolved: boolean
  cTypesResolved: boolean
}

class VerifyClaim extends React.Component<Props, State> {
  private cTypeMap: Map<string, CType>

  constructor(props: Props) {
    super(props)
    this.cTypeMap = new Map()
    this.state = {
      attestersResolved: false,
      cTypesResolved: false,
    }
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
        return CTypeRepository.findByHash(attestedClaim.request.claim.cType)
      })
    ).then((cTypes: ICType[]) => {
      cTypes.forEach((cType: ICType) => {
        if (cType.cType.hash) {
          this.cTypeMap[cType.cType.hash] = CType.fromObject(cType)
        }
      })
      this.setState({
        cTypesResolved: true,
      })
    })
  }

  public render() {
    const { attestedClaims, context } = this.props
    const { attestersResolved, cTypesResolved } = this.state

    return attestersResolved && cTypesResolved ? (
      <AttestedClaimsListView attestedClaims={attestedClaims} />
    ) : (
      <Spinner size={20} color="#ef5a28" strength={3} />
    )
  }
}

export default VerifyClaim
