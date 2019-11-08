import * as sdk from '@kiltprotocol/sdk-js'

export interface ICType extends sdk.ICTypeMetadata {
  cType: sdk.ICType
  metaData: {
    author: string
  }
}

export interface CTypeMetadata {
  cType: {
    schema: sdk.CType['schema']
    metadata: sdk.CTypeMetadata['metadata']
    owner: sdk.CType['owner']
    hash: sdk.CType['hash']
  }
  metaData: {
    author: string
  }
}

export interface ICTypeInput {
  $id: string
  $schema: string
  properties: object[] // TO DO: need to refine what properties are
  required: string[]
  title: string
  description?: string
  type: string
  owner?: string
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

  public metaData: {
    author: string
  }
  public readonly cType: sdk.ICType
  public metadata: sdk.CTypeMetadata['metadata']
  public ctypeHash: sdk.ICType['hash']
  public getPropertyTitle(propertyName: string) {
    return this.metadata.properties[propertyName].title.default
  }
}
