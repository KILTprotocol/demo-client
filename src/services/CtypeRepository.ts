import { ICType } from '@kiltprotocol/types'
import * as CTypes from '../state/ducks/CTypes'
import { persistentStoreInstance } from '../state/PersistentStore'
import { ICTypeWithMetadata } from '../types/Ctype'

import { BasePostParams } from './BaseRepository'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class CTypeRepository {
  public static async findByHash(
    hash: ICType['hash']
  ): Promise<undefined | ICTypeWithMetadata> {
    const storedCType = CTypes.getCType(
      persistentStoreInstance.store.getState(),
      hash
    )

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
      .then((cType: ICTypeWithMetadata) => {
        persistentStoreInstance.store.dispatch(CTypes.Store.addCType(cType))
        return cType
      })
      .catch(() => {
        console.error(`Could not fetch CType with hash '${hash}'`)
        return undefined
      })
  }

  public static async findAll(): Promise<ICTypeWithMetadata[]> {
    return fetch(`${CTypeRepository.URL}`)
      .then(response => response.json())
      .then((cTypes: ICTypeWithMetadata[]) => {
        persistentStoreInstance.store.dispatch(CTypes.Store.addCTypes(cTypes))
        return CTypes.getCTypes(persistentStoreInstance.store.getState())
      })
  }

  public static async register(cType: ICTypeWithMetadata): Promise<Response> {
    return fetch(CTypeRepository.URL, {
      ...BasePostParams,
      body: JSON.stringify(cType),
    })
  }

  private static readonly URL = `${window._env_.REACT_APP_SERVICE_HOST}/ctype`
}

export default CTypeRepository
