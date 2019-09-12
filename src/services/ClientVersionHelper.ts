import * as sdk from '@kiltprotocol/sdk-js'

import PersistentStore from '../state/PersistentStore'
import * as Parameters from '../state/ducks/Parameters'
import * as Wallet from '../state/ducks/Wallet'
import { BalanceUtilities } from './BalanceUtilities'
import BlockchainService from './BlockchainService'

type CheckResult = {
  blockPurged: boolean
  accountInvalid: boolean
}

class ClientVersionHelper {
  public async clientResetRequired(): Promise<CheckResult> {
    const resetCause: CheckResult = {
      accountInvalid: false,
      blockPurged: false,
    }
    return new Promise<CheckResult>(async (resolve, reject) => {
      const blockCheck: boolean = await this.checkHash()
      if (!blockCheck) {
        resetCause.blockPurged = true
      } else {
        const selectedIdentity: Wallet.Entry = Wallet.getSelectedIdentity(
          PersistentStore.store.getState()
        )
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
      resolve(resetCause)
    })
  }

  /**
   * @description (PUBLIC) (ASYNC) checks whether the stored blockhash matches the chain blockhash at Index 1
   * @returns boolean check whether hashes match
   */
  public async checkHash(): Promise<boolean> {
    const blockchain = await BlockchainService.connect()
    const versionNumber = (await blockchain.getStats()).nodeVersion.toString()
    const blockHash = (await blockchain.api.rpc.chain.getBlockHash(1)).toHex()

    return this.isHashDifferent(blockHash, versionNumber)
  }
  public async isHashDifferent(chainHash: string, versionNumber: string) {
    let differentChain = false
    const parameters = Parameters.getParameters(
      PersistentStore.store.getState()
    )
    if (parameters.blockHash === Parameters.DEFAULT_BLOCK_HASH) {
      this.updateBlockNumber(chainHash, versionNumber)
    } else if (parameters.blockHash !== chainHash) {
      differentChain = true
    }
    if (differentChain) {
      console.log(
        `Block Progression Mismatch, stored Blockhash at Index 1: ${
          parameters.blockHash
        } actual chain Blockhash at Index 1: ${chainHash}`
      )
    }
    return !differentChain
  }
  public async updateBlockNumber(
    newBlockHashCheck: string,
    newVersionCheck: string
  ) {
    PersistentStore.store.dispatch(
      Parameters.Store.updateParameters({
        blockHash: newBlockHashCheck,
        chainVersion: newVersionCheck,
      })
    )
  }

  public resetAndReloadClient(): void {
    PersistentStore.reset()
    window.location.reload()
  }
}
const clientVersionHelper = new ClientVersionHelper()

export { CheckResult, clientVersionHelper }
