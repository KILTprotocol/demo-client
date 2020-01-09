import * as sdk from '@kiltprotocol/sdk-js'

export interface ICType extends sdk.ICTypeMetadata {
  cType: sdk.ICType
}

export interface CTypeWithMetadata {
  cType: sdk.ICType
  metaData: sdk.ICTypeMetadata
}

export interface ICTypeInput {
  $id: string
  $schema: string
  properties: object[] // TO DO: need to refine what properties are
  required: string[]
  title: string
  description: string
  type: string
  owner: string | null
}

export interface IClaimInput {
  $id: string
  $schema: string
  properties: object
  required: string[]
  title: string
  description?: string
  type: string
  owner?: string
}
