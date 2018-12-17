import axios, { AxiosResponse } from 'axios'
import { CType } from '../types/Ctype'

// TODO: add tests, create interface for this class to be implemented as mock (for other tests)

class CtypeRepository {
  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/ctype`

  public async findByKey(key: string): Promise<CType> {
    const response = await axios.get(`${CtypeRepository.URL}/${key}`)
    const ctype = response.data as CType
    return ctype
  }

  public async findAll(): Promise<CType[]> {
    const response = await axios.get(CtypeRepository.URL)
    const ctypes = response.data as CType[]
    return ctypes
  }

  public async register(cType: CType): Promise<AxiosResponse> {
    const response = await axios.post(CtypeRepository.URL, cType)
    return response
  }

  public async removeAll() {
    return Promise.reject('implement')
  }
}

export default new CtypeRepository()
