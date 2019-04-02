import { Blockchain, CType, ICType } from '@kiltprotocol/prototype-sdk'

import { ICType as IWrapperCtype } from '../../types/Ctype'

import { notifySuccess } from '../../services/FeedbackService'
import BlockchainService from '../../services/BlockchainService'
import errorService from '../../services/ErrorService'
import CTypeRepository from '../../services/CtypeRepository'

import { getIdentity } from './DevTools.utils'

export const saveCtype = async (rawCtype: ICType, alias: string) => {
  const cType = CType.fromObject(rawCtype)
  const blockchain: Blockchain = await BlockchainService.connect()

  const rootAttester = getIdentity('RootAttester')
  if (!rootAttester) {
    throw new Error(`${alias} not found`)
  }
  const { identity } = rootAttester

  return cType
    .store(blockchain, identity)
    .then((value: any) => {
      const cTypeWrapper: IWrapperCtype = {
        cType,
        metaData: {
          author: identity.address,
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
