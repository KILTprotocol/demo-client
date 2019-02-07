export interface CType {
  _id?: string
  __v?: number
  key: string
  name: string
  author: string
  definition: string
}

export class CTypeImpl implements CType {
  public static fromObject(obj: CType): CTypeImpl {
    const newCtype = Object.create(CTypeImpl.prototype)
    return Object.assign(newCtype, obj)
  }

  public _id?: string
  public __v?: number
  public key: string
  public name: string
  public author: string
  public definition: string

  public getPropertyTitle(propertyName: string) {
    return JSON.parse(this.definition).metadata.properties[propertyName].title
      .default
  }
}
