export interface ICType {
  _id?: string
  __v?: number
  key: string
  name: string
  author: string
  definition: string
}

export class CType implements ICType {
  public static fromObject(obj: ICType): CType {
    const newCtype = Object.create(CType.prototype)
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
