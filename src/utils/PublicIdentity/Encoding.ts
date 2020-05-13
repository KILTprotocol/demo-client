import { IPublicIdentity, IDelegationNode } from '@kiltprotocol/sdk-js'

const encodePublicIdentity = (publicIdentity: IPublicIdentity): string[] => [
  publicIdentity.address,
  publicIdentity.boxPublicKeyAsHex,
  ...(publicIdentity.serviceAddress ? [publicIdentity.serviceAddress] : []),
]

export type IAttesterWithDelegation = {
  publicIdentity: IPublicIdentity
  delegation: IDelegationNode['id']
}

const encodePublicIdentityWithDelegation = (
  publicIdentityWithDelegation: IAttesterWithDelegation
): string[] => [
  publicIdentityWithDelegation.publicIdentity.address,
  publicIdentityWithDelegation.publicIdentity.boxPublicKeyAsHex,
  ...(publicIdentityWithDelegation.publicIdentity.serviceAddress
    ? [publicIdentityWithDelegation.publicIdentity.serviceAddress]
    : []),
  publicIdentityWithDelegation.delegation,
]

export { encodePublicIdentity, encodePublicIdentityWithDelegation }
