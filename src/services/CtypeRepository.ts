import * as sdk from '@kiltprotocol/prototype-sdk'

import { ICType } from '../types/Ctype'
import { BasePostParams } from './BaseRepository'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class CTypeRepository {
  public static async findByHash(hash: sdk.ICType['hash']): Promise<ICType> {
    console.log('hash', hash)

    return fetch(`${CTypeRepository.URL}/${hash}`).then(response =>
      response.json()
    )
  }

  public static async findAll(): Promise<ICType[]> {
    return fetch(`${CTypeRepository.URL}`).then(response => response.json())
  }

  public static async register(cType: ICType): Promise<Response> {
    return fetch(CTypeRepository.URL, {
      ...BasePostParams,
      body: JSON.stringify(cType),
    })
  }

  public static async removeAll() {
    return Promise.reject('implement')
  }

  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/ctype`
}

export default CTypeRepository
