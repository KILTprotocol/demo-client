import * as sdk from '@kiltprotocol/sdk-js'
import ICTypeMetadata, { IMetadata } from '@kiltprotocol/sdk-js/build/types/CTypeMetedata'

export interface ICType extends sdk.ICTypeMetadata {
  cType: sdk.ICType
}

export interface CTypeMetadataChain {
  cType: sdk.CType
  metaData: ICTypeMetadata
}
export interface CTypeMetadata {
  cType: sdk.ICType
  metaData: sdk.ICTypeMetadata,
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

export class CType implements ICType {
  public static fromObject(obj: CTypeMetadata): CType {
    const newCtype = Object.create(CType.prototype)
    return Object.assign(newCtype, obj)
  }

  public readonly cType: sdk.ICType
  public metadata: IMetadata
  public ctypeHash: sdk.ICType['hash']
  public getPropertyTitle(propertyName: string) {
    return propertyName // Need to fix. I need to take the value of the key.
  }
}
