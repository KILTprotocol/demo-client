import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import Spinner from '../../../components/Spinner/Spinner'

import ContactRepository from '../../../services/ContactRepository'
import CTypeRepository from '../../../services/CtypeRepository'
import { CType, ICType } from '../../../types/Ctype'

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
  context?: 'legitimation'
}

type State = {
  cTypesResolved: boolean
}

class VerifyClaim extends React.Component<Props, State> {
  private cTypeMap: Map<string, CType>

  constructor(props: Props) {
    super(props)
    this.cTypeMap = new Map()
    this.state = {
      cTypesResolved: false,
    }
  }

  public componentDidMount() {
    const { attestedClaims } = this.props
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
    const { attestedClaims } = this.props
    const { cTypesResolved } = this.state

    return cTypesResolved ? (
      <AttestedClaimsListView attestedClaims={attestedClaims} />
    ) : (
      <Spinner size={20} color="#ef5a28" strength={3} />
    )
  }
}

export default VerifyClaim
