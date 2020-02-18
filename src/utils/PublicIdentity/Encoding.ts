import { IPublicIdentity } from '@kiltprotocol/sdk-js'

const encodePublicIdentity = (
  publicIdentity: IPublicIdentity
): Array<string> => [
  publicIdentity.address,
  publicIdentity.boxPublicKeyAsHex,
  ...(publicIdentity.serviceAddress ? [publicIdentity.serviceAddress] : []),
]

export { encodePublicIdentity }
