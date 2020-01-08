import * as sdk from '@kiltprotocol/sdk-js'

import BlockchainService from '../../services/BlockchainService'
import CTypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import { notifySuccess, notifyError } from '../../services/FeedbackService'
import { CTypeMetadata } from '../../types/Ctype'
import { BsIdentity } from './DevTools.wallet'

import cTypesPool from './data/cTypes.json'

type UpdateCallback = (bsCTypeKey: keyof BsCTypesPool) => void

interface BsCTypesPoolElement extends sdk.ICType {
  owner: string
  metadata: sdk.ICTypeMetadata['metadata']
}

type BsCTypesPool = {
  [key: string]: BsCTypesPoolElement
}

class BsCType {
  public static pool: BsCTypesPool = cTypesPool as BsCTypesPool

  public static async save(bsCTypeData: BsCTypesPoolElement): Promise<void> {
    // replace owner key with his address
    const ownerIdentity = (await BsIdentity.getByKey(bsCTypeData.owner))
      .identity

    const cType = sdk.CType.fromCType({
      schema: bsCTypeData.schema,
      hash: bsCTypeData.hash,
      owner: ownerIdentity.address
    })

    cType
      .store(ownerIdentity)
      .catch(error => {
        errorService.log({
          error,
          message: 'Could not submit CTYPE to the Blockchain',
          origin: 'CType.store()',
        })
        notifyError(error)
      }).then(() => {
        const cTypeWrapper: CTypeMetadata = {
          cType,
          metaData: {
            metadata: bsCTypeData.metadata,
            ctypeHash: cType.hash
          },
        }
        return CTypeRepository.register(cTypeWrapper).then(() => {
          notifySuccess(`CTYPE ${cType.schema.$id} successfully created.`)
        })
          .catch(error => {
            errorService.log({
              error,
              message: 'Could not submit CTYPE',
              origin: 'CTypeCreate.submit()',
            })
            notifyError(error)
          })
      })
  }

  public static async savePool(updateCallback?: UpdateCallback): Promise<void> {
    const bsCTypeKeys = Object.keys(BsCType.pool)
    const requests = bsCTypeKeys.reduce((promiseChain, bsCTypeKey) => {
      return promiseChain.then(() => {
        if (updateCallback) {
          updateCallback(bsCTypeKey)
        }
        return BsCType.save(BsCType.pool[bsCTypeKey])
      })
    }, Promise.resolve())
    return requests
  }

  public static async getByHash(
    hash: sdk.ICType['hash']
  ): Promise<CTypeMetadata> {
    const cType = await CTypeRepository.findByHash(hash)
    if (cType) {
      return cType
    }
    throw new Error(`Could not find cType with hash '${hash}'`)
  }

  public static async get(
    bsCType: BsCTypesPoolElement
  ): Promise<CTypeMetadata> {
    return BsCType.getByHash(bsCType.hash)
  }

  public static async getByKey(
    bsCTypeKey: keyof BsCTypesPool
  ): Promise<CTypeMetadata> {
    const { hash } = BsCType.pool[bsCTypeKey]
    return BsCType.getByHash(hash)
  }
}

export { BsCTypesPool, BsCType }
