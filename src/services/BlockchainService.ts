import Kilt, { IBlockchainApi } from '@kiltprotocol/sdk-js'

class BlockchainService {
  public static instance: Promise<IBlockchainApi>

  public static async connect(
    host: string = this.getNodeWebsocketUrl()
  ): Promise<IBlockchainApi> {
    Kilt.config({ address: host })
    return Kilt.connect()
  }

  public static getNodeWebsocketUrl(): string {
    return `${window._env_.REACT_APP_NODE_HOST}`
  }
}

export default BlockchainService
