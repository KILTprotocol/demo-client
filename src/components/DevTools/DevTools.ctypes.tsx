import { CType, BlockchainUtils, ChainHelpers } from '@kiltprotocol/sdk-js'
import { ICType, ICTypeMetadata } from '@kiltprotocol/types'
import CTypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import { notifySuccess, notifyError } from '../../services/FeedbackService'
import { ICTypeWithMetadata } from '../../types/Ctype'
import { BsIdentity } from './DevTools.wallet'

import cTypesPool from './data/cTypes.json'

type UpdateCallback = (bsCTypeKey: keyof BsCTypesPool) => void

interface IBsCTypesPoolElement extends ICType {
  owner: string
  metadata: ICTypeMetadata['metadata']
}

export type BsCTypesPool = {
  [key: string]: IBsCTypesPoolElement
}

class BsCType {
  public static pool: BsCTypesPool = cTypesPool as BsCTypesPool

  public static async save(bsCTypeData: IBsCTypesPoolElement): Promise<void> {
    // replace owner key with his address
    const ownerIdentity = (await BsIdentity.getByKey(bsCTypeData.owner))
      .identity
    const cType = CType.fromSchema(bsCTypeData.schema, ownerIdentity.address)
    const tx = await cType.store()
    const extrinsic = BlockchainUtils.signAndSubmitTx(tx, ownerIdentity, {
      resolveOn: BlockchainUtils.IS_IN_BLOCK,
    })

    return extrinsic
      .catch((error: ChainHelpers.ExtrinsicError) => {
        if (
          error.errorCode ===
          ChainHelpers.ExtrinsicErrors.CType.ERROR_CTYPE_ALREADY_EXISTS.code
        ) {
          notifyError(error, false)
        } else throw error
      })
      .then(() => {
        const cTypeWrapper: ICTypeWithMetadata = {
          cType: { ...cType, owner: null },
          metaData: {
            metadata: bsCTypeData.metadata,
            ctypeHash: cType.hash,
          },
        }
        // TODO: add onrejected when sdk provides error handling
        return CTypeRepository.register(cTypeWrapper)
      })
      .then(() => {
        notifySuccess(
          `CTYPE ${bsCTypeData.metadata.title.default} successfully created.`
        )
      })
      .catch((error) => {
        errorService.log({
          error,
          message: 'Could not submit CTYPE',
          origin: 'DevTools.ctypes.tsx.BsCType.save()',
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
    hash: ICType['hash']
  ): Promise<ICTypeWithMetadata> {
    const cType = await CTypeRepository.findByHash(hash)
    if (cType) {
      return cType
    }
    throw new Error(`Could not find cType with hash '${hash}'`)
  }

  public static async get(
    bsCType: IBsCTypesPoolElement
  ): Promise<ICTypeWithMetadata> {
    return BsCType.getByHash(bsCType.hash)
  }

  public static async getByKey(
    bsCTypeKey: keyof BsCTypesPool
  ): Promise<ICTypeWithMetadata> {
    const { hash } = BsCType.pool[bsCTypeKey]
    return BsCType.getByHash(hash)
  }
}

export { BsCType }
