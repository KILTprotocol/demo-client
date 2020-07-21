import { IAttestedClaim } from '@kiltprotocol/sdk-js'
import * as Claims from '../../state/ducks/Claims'

// eslint-disable-next-line import/prefer-default-export
export const buildMatchingAttestedClaims = (
  entry: Claims.Entry
): IAttestedClaim[] => {
  return entry.attestedClaims.reduce(
    (acc: IAttestedClaim[], { attestation }) => {
      const attestedClaim = entry.attestedClaims.find(
        ({ request }) => attestation.claimHash === request.rootHash
      )
      if (attestedClaim) {
        acc.push(attestedClaim)
        return acc
      }
      return acc
    },
    []
  )
}
