import axios from 'axios'
import Optional from 'typescript-optional'
import { CType } from '../types/Ctype'

// TODO: add tests, create interface for this class to be implemented as mock (for other tests)

class CtypeRepository {
  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/ctype`

  public async findByKey(key: string): Promise<Optional<CType>> {
    return Promise.reject('implement')
  }

  public async findAll(): Promise<CType[]> {
    const response = await axios.get(CtypeRepository.URL)
    const ctypes = response.data as CType[]
    return ctypes
  }

  public async register(cType: CType): Promise<CType> {
    return Promise.reject('implement')
  }

  public async removeAll() {
    return Promise.reject('implement')
  }
}

export default new CtypeRepository()
