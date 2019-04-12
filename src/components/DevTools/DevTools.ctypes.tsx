import * as sdk from '@kiltprotocol/prototype-sdk'

import BlockchainService from '../../services/BlockchainService'
import CTypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import { notifySuccess } from '../../services/FeedbackService'
import { ICType } from '../../types/Ctype'
import { BsIdentity } from './DevTools.wallet'

import cTypesPool from './data/cTypes.json'

type UpdateCallback = (bsCTypeKey: keyof BsCTypesPool) => void

interface BsCTypesPoolElement extends sdk.ICType {
  owner: string
}

type BsCTypesPool = {
  [key: string]: BsCTypesPoolElement
}

class BsCType {
  public static pool: BsCTypesPool = cTypesPool as BsCTypesPool

  public static async save(
    bsCTypeData: BsCTypesPoolElement,
    bsCTypeKey?: keyof BsCTypesPool
  ): Promise<void> {
    // replace owner key with his address
    const ownerIdentity = (await BsIdentity.getByKey(bsCTypeData.owner))
      .identity

    const cType = sdk.CType.fromObject({
      ...bsCTypeData,
      owner: ownerIdentity.address,
    })
    const blockchain: sdk.Blockchain = await BlockchainService.connect()

    return cType
      .store(blockchain, ownerIdentity)
      .then((value: any) => {
        const cTypeWrapper: ICType = {
          cType,
          metaData: {
            author: ownerIdentity.address,
          },
        }
        // TODO: add onrejected when sdk provides error handling
        return CTypeRepository.register(cTypeWrapper)
      })
      .then(() => {
        notifySuccess(
          `CTYPE ${cType.metadata.title.default} successfully created.`
        )
      })
      .catch(error => {
        errorService.log({
          error,
          message: 'Could not submit CTYPE',
          origin: 'CTypeCreate.submit()',
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
        return BsCType.save(BsCType.pool[bsCTypeKey], bsCTypeKey)
      })
    }, Promise.resolve())
    return requests
  }

  public static async get(bsCType: BsCTypesPoolElement): Promise<ICType> {
    return CTypeRepository.findByHash(bsCType.hash)
  }

  public static async getByKey(
    bsCTypeKey: keyof BsCTypesPool
  ): Promise<ICType> {
    const { hash } = BsCType.pool[bsCTypeKey]
    return CTypeRepository.findByHash(hash)
  }
}

export { BsCTypesPool, BsCType }
