import * as sdk from '@kiltprotocol/prototype-sdk'

import PersistentStore from 'src/state/PersistentStore'
import * as Parameters from '../state/ducks/Parameters'
import * as Wallet from '../state/ducks/Wallet'
import BalanceUtilities from './BalanceUtilities'
import BlockchainService from './BlockchainService'

type CheckResult = {
  versionMismatch: boolean
  accountInvalid: boolean
}

class ClientVersionHelper {
  public async clientResetRequired(): Promise<CheckResult> {
    const resetCause: CheckResult = {
      accountInvalid: false,
      versionMismatch: false,
    }
    return new Promise<CheckResult>(async (resolve, reject) => {
      const versionMatches: boolean = await this.checkVersion()
      if (!versionMatches) {
        resetCause.versionMismatch = true
      } else {
        const selectedIdentity: Wallet.Entry = Wallet.getSelectedIdentity(
          PersistentStore.store.getState()
        )
        if (selectedIdentity) {
          const balance: number = await BalanceUtilities.getMyBalance(
            selectedIdentity
          )
          if (balance <= 0) {
            resetCause.accountInvalid = true
          }
        }
      }
      console.log(resetCause)
      resolve(resetCause)
    })
  }

  public async checkVersion(): Promise<boolean> {
    const blockchain: sdk.Blockchain = await BlockchainService.connect()
    const chainVersion: string = (await blockchain.getStats()).nodeVersion.toString()

    const parameters = Parameters.getParameters(
      PersistentStore.store.getState()
    )
    const storedChainVersion = parameters.chainVersion

    if (storedChainVersion === Parameters.DEFAULT_CHAIN_VERSION) {
      this.updateVersion(chainVersion)
      return true
    }
    const versionsMatching = chainVersion === storedChainVersion
    if (!versionsMatching) {
      console.log(
        `version mismatch detected: chain version=${chainVersion}, client chain version=${storedChainVersion}`
      )
    }
    return versionsMatching
  }

  public updateVersion(newVersion: string): void {
    PersistentStore.store.dispatch(
      Parameters.Store.updateParameters({ chainVersion: newVersion })
    )
  }

  public resetAndReloadClient(): void {
    PersistentStore.reset()
    window.location.reload()
  }
}
const clientVersionHelper = new ClientVersionHelper()

export { CheckResult, clientVersionHelper }
