import * as sdk from '@kiltprotocol/prototype-sdk'

import * as CTypes from '../state/ducks/CTypes'
import PersistentStore from '../state/PersistentStore'
import { ICType } from '../types/Ctype'

import { BasePostParams } from './BaseRepository'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class CTypeRepository {
  public static async findByHash(
    hash: sdk.ICType['hash']
  ): Promise<void | ICType> {
    const storedCType = CTypes.getCType(PersistentStore.store.getState(), hash)

    if (storedCType) {
      return storedCType
    }

    return fetch(`${CTypeRepository.URL}/${hash}`)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        return response
      })
      .then(response => response.json())
      .then((cType: ICType) => {
        PersistentStore.store.dispatch(CTypes.Store.addCType(cType))
        return cType
      })
      .catch(() => {
        console.error(`Could not fetch CType with hash '${hash}'`)
      })
  }

  public static async findAll(): Promise<ICType[]> {
    return fetch(`${CTypeRepository.URL}`)
      .then(response => response.json())
      .then((cTypes: ICType[]) => {
        PersistentStore.store.dispatch(CTypes.Store.addCTypes(cTypes))
        return CTypes.getCTypes(PersistentStore.store.getState())
      })
  }

  public static async register(cType: ICType): Promise<Response> {
    return fetch(CTypeRepository.URL, {
      ...BasePostParams,
      body: JSON.stringify(cType),
    })
  }

  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/ctype`
}

export default CTypeRepository
