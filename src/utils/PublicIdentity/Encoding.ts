import { IPublicIdentity } from '@kiltprotocol/sdk-js'

const encodePublicIdentity = (publicIdentity: IPublicIdentity): string[] => [
  publicIdentity.address,
  publicIdentity.boxPublicKeyAsHex,
  ...(publicIdentity.serviceAddress ? [publicIdentity.serviceAddress] : []),
]

export default encodePublicIdentity
