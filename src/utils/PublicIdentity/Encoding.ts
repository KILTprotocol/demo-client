import { IPublicIdentity, IDelegationNode } from '@kiltprotocol/sdk-js'

export type IAttesterWithDelegation = {
  publicIdentity: IPublicIdentity
  delegationId: IDelegationNode['id']
}

const encodePublicIdentity = (publicIdentity: IPublicIdentity): string[] => [
  publicIdentity.address,
  publicIdentity.boxPublicKeyAsHex,
  publicIdentity.serviceAddress || '',
]

const encodePublicIdentityWithDelegation = (
  publicIdentityWithDelegation: IAttesterWithDelegation
): string[] => [
  publicIdentityWithDelegation.publicIdentity.address,
  publicIdentityWithDelegation.publicIdentity.boxPublicKeyAsHex,
  publicIdentityWithDelegation.publicIdentity.serviceAddress || '',
  publicIdentityWithDelegation.delegationId,
]

export { encodePublicIdentity, encodePublicIdentityWithDelegation }
