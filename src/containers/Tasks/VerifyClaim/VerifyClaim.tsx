import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'

import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
  context?: 'term'
}

const VerifyClaim: React.FC<Props> = ({ attestedClaims }) => (
  <AttestedClaimsListView attestedClaims={attestedClaims} />
)

export default VerifyClaim
