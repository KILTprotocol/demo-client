import { IPublicIdentity } from '@kiltprotocol/sdk-js'

type TPublicIdentityEncoded = {
  a: string
  b: string
  s?: string
}

const encodePublicIdentity = (
  publicIdentity: IPublicIdentity
): TPublicIdentityEncoded => ({
  a: publicIdentity.address,
  b: publicIdentity.boxPublicKeyAsHex,
  ...(publicIdentity.serviceAddress
    ? { s: publicIdentity.serviceAddress }
    : {}),
})

export { encodePublicIdentity }
