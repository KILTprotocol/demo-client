import { ICType } from '../types/Ctype'
import { BasePostParams } from './BaseRepository'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class CtypeRepository {
  public static async findByKey(key: string): Promise<ICType> {
    return fetch(`${CtypeRepository.URL}/${key}`).then(response =>
      response.json()
    )
  }

  public static async findAll(): Promise<ICType[]> {
    return fetch(`${CtypeRepository.URL}`).then(response => response.json())
  }

  public static async register(cType: ICType): Promise<Response> {
    return fetch(CtypeRepository.URL, {
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

export default CtypeRepository
