import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'

import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
  context?: 'legitimation'
}

type State = {}

class VerifyClaim extends React.Component<Props, State> {
  public render() {
    const { attestedClaims } = this.props
    return <AttestedClaimsListView attestedClaims={attestedClaims} />
  }
}

export default VerifyClaim
