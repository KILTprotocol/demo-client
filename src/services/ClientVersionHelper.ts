import { Hash } from '@polkadot/types/interfaces'

import { persistentStoreInstance } from '../state/PersistentStore'
import * as Parameters from '../state/ducks/Parameters'
import * as Wallet from '../state/ducks/Wallet'
import BlockchainService from './BlockchainService'

export type CheckResult = {
  firstBlockHashChanged: boolean
  accountInvalid: boolean
}

class ClientVersionHelper {
  public static async clientResetRequired(): Promise<CheckResult> {
    const resetCause: CheckResult = {
      accountInvalid: false,
      firstBlockHashChanged: false,
    }
    const blockCheck = await ClientVersionHelper.checkHash()
    if (!blockCheck) {
      resetCause.firstBlockHashChanged = true
    } else {
      const selectedIdentity = Wallet.getSelectedIdentity(
        persistentStoreInstance.store.getState()
      )?.identity

      if (selectedIdentity) {
        // [ap] disable balance check since we have zero-balanced accounts initially.
        // const balance: number = await BalanceUtilities.getMyBalance(
        //   selectedIdentity
        // )
        // if (balance <= 0) {
        //   resetCause.accountInvalid = true
        // }
      }
    }
    return resetCause
  }

  /**
   * @description (PUBLIC) (ASYNC) checks whether the stored blockhash matches the chain blockhash at Index 1
   * @returns check whether hashes match
   */
  public static async checkHash(): Promise<boolean> {
    const blockchain = await BlockchainService.connect()
    const blockHash = (
      await blockchain.api.rpc.chain.getBlockHash<Hash>(1)
    ).toHex()

    return ClientVersionHelper.isHashMatching(blockHash)
  }

  public static isHashMatching(chainHash: string): boolean {
    let differentChain = false
    const parameters = Parameters.getParameters(
      persistentStoreInstance.store.getState()
    )
    if (
      !parameters.blockHash ||
      parameters.blockHash === Parameters.DEFAULT_BLOCK_HASH
    ) {
      ClientVersionHelper.updateBlockNumber(chainHash)
    } else if (parameters.blockHash !== chainHash) {
      differentChain = true
    }
    if (differentChain) {
      console.log(
        `Block Progression Mismatch, stored Blockhash at Index 1: ${parameters.blockHash} actual chain Blockhash at Index 1: ${chainHash}`
      )
    }
    return !differentChain
  }

  public static updateBlockNumber(newBlockHashCheck: string): void {
    persistentStoreInstance.store.dispatch(
      Parameters.Store.updateParameters({
        blockHash: newBlockHashCheck,
      })
    )
  }

  public static resetAndReloadClient(): void {
    persistentStoreInstance.reset()
    window.location.reload()
  }
}
export default ClientVersionHelper
