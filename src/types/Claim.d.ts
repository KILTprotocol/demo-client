export type Claim = {
  contents: any
}

// TODO: import from SDK
export type Attestation = {
  claimHash: string
  signature: string
  owner: string
  revoked: boolean
}
