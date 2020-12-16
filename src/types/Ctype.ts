import { ICTypeMetadata, ICType as SDKICType } from '@kiltprotocol/sdk-js'

export interface ICType extends ICTypeMetadata {
  cType: SDKICType
}

export interface ICTypeWithMetadata {
  cType: SDKICType
  metaData: ICTypeMetadata
}

export interface ICTypeInput {
  $id: string
  $schema: string
  properties: ICTypeInputProperty[]
  required: string[]
  title: string
  description: string
  type: string
  owner: string | null
}

export interface ICTypeInputProperty {
  title: string
  $id: string
  type: string
  format?: string
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
