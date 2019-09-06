import * as sdk from '@kiltprotocol/sdk-js'

import PersistentStore from '../state/PersistentStore'
import * as Parameters from '../state/ducks/Parameters'
import * as Wallet from '../state/ducks/Wallet'
import { BalanceUtilities } from './BalanceUtilities'
import BlockchainService from './BlockchainService'
import { u8aToHex } from '@polkadot/util'

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
      const blockCheck: boolean = await this.checkBlock()
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

  public async checkBlock(): Promise<boolean> {
    const blockchain = await BlockchainService.connect()
    const versionNumber = (await blockchain.getStats()).nodeVersion.toString()
    const lastBlock = parseInt(await blockchain.listenToLastBlock(), 10)
    const parameters = Parameters.getParameters(
      PersistentStore.store.getState()
    )
    if (parameters.blockNumber === Parameters.DEFAULT_BLOCK_NUMBER) {
      this.updateBlockNumber(lastBlock, versionNumber)
      return true
    }
    const chainBlockHash = await blockchain.api.rpc.chain
      .getBlockHash(parameters.blockNumber)
      .then(block => {
        return block.toHex()
      })
    let differentChain = false
    const differentBlockState = lastBlock < parameters.blockNumber
    if (!differentBlockState) {
      const differentHash = chainBlockHash !== parameters.blockHash
      if (differentHash) {
        differentChain = true
      }
    } else {
      differentChain = true
    }
    if (differentChain) {
      console.log(
        `Block Progression Mismatch, stored best Block Number: ${parameters.blockNumber} stored Hash of best Block : ${parameters.blockHash} actual chain best Block Number: ${lastBlock} actual chain Hash of Block at Index of stored Block : ${chainBlockHash}`
      )
    }
    return !differentChain
  }

  public async updateBlockNumber(
    newCheckBlockNumber: number,
    newVersion: string
  ) {
    const blockchain = await BlockchainService.connect()
    const newBlockHashCheck = await blockchain.api.rpc.chain
      .getBlockHash(newCheckBlockNumber)
      .then(block => {
        return block.toHex()
      })

    PersistentStore.store.dispatch(
      Parameters.Store.updateParameters({
        blockHash: newBlockHashCheck,
        blockNumber: newCheckBlockNumber,
        chainVersion: newVersion,
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
