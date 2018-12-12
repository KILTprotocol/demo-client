import Optional from 'typescript-optional'
import { CType } from '../types/Ctype'

// TODO: add tests, create interface for this class to be implemented as mock (for other tests)

class CtypeRepository {
  public async findByKey(key: string): Promise<Optional<CType>> {
    return Promise.reject('implement')
  }

  public async findAll(): Promise<Optional<CType[]>> {
    return Promise.reject('implement')
  }

  public async register(cType: CType): Promise<CType> {
    return Promise.reject('implement')
  }

  public async removeAll() {
    return Promise.reject('implement')
  }
}

export default new CtypeRepository()
