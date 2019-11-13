import * as sdk from '@kiltprotocol/sdk-js'

export interface ICType {
  cType: sdk.ICType
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
}

export interface IClaimInput {
  $id: string
  $schema: string
  properties: object
  required: string[]
  title: string
  description?: string
  type: string
}

export class CType implements ICType {
  public static fromObject(obj: ICType): CType {
    const newCtype = Object.create(CType.prototype)
    return Object.assign(newCtype, obj)
  }

  public metaData: {
    author: string
  }
  public readonly cType: sdk.ICType

  public getPropertyTitle(propertyName: string) {
    return this.cType.metadata.properties[propertyName].title.default
  }
}
