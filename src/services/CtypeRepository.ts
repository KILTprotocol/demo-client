import { CType } from '../types/Ctype'
import { BasePostParams } from './BaseRepository'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class CtypeRepository {
  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/ctype`

  public static async findByKey(key: string): Promise<CType> {
    return fetch(`${CtypeRepository.URL}/${key}`).then(response =>
      response.json()
    )
  }

  public static async findAll(): Promise<CType[]> {
    return fetch(`${CtypeRepository.URL}`).then(response => response.json())
  }

  public static async register(cType: CType): Promise<Response> {
    return fetch(CtypeRepository.URL, {
      ...BasePostParams,
      body: JSON.stringify(cType),
    })
  }

  public static async removeAll() {
    return Promise.reject('implement')
  }
}

export default CtypeRepository
