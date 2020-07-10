import {
  IAttestedClaim,
  IAttestation,
  IRequestForAttestation,
} from '@kiltprotocol/sdk-js'
import * as Claims from '../../state/ducks/Claims'

// eslint-disable-next-line import/prefer-default-export
export const buildMatchingAttestedClaims = (
  entry: Claims.Entry
): IAttestedClaim[] => {
  return entry.attestations.reduce(
    (acc: IAttestedClaim[], attestation: IAttestation) => {
      const request = entry.requestForAttestations.find(
        (requestForAttestation: IRequestForAttestation) =>
          attestation.claimHash === requestForAttestation.rootHash
      )
      if (request) {
        acc.push({ attestation, request } as IAttestedClaim)
        return acc
      }
      return acc
    },
    []
  )
}
