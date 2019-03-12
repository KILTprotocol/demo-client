import * as sdk from '@kiltprotocol/prototype-sdk'

import * as Wallet from '../state/ducks/Wallet'
import BlockchainService from './BlockchainService'
import PersistentStore from '../state/PersistentStore'
import * as Delegations from '../state/ducks/Delegations'

class DelegationsService {
  public async store(
    delegationRoot: sdk.DelegationRootNode,
    alias: string
  ): Promise<void> {
    const selectedIdentity: sdk.Identity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    ).identity
    const blockchain = await BlockchainService.connect()
    return new Promise<void>((resolve, reject) => {
      delegationRoot
        .store(blockchain, selectedIdentity)
        .then((result: any) => {
          PersistentStore.store.dispatch(
            Delegations.Store.saveDelegationAction({
              account: delegationRoot.account || '',
              ctype: delegationRoot.ctypeHash,
              id: delegationRoot.id,
              metaData: {
                alias,
              },
            })
          )
          resolve()
        })
        .catch(err => {
          reject(err)
        })
    })
  }
}

export default new DelegationsService()
