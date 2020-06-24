import Kilt, { IBlockchainApi } from '@kiltprotocol/sdk-js'

class BlockchainService {
  public static instance: Promise<IBlockchainApi>

  public static async connect(
    host: string = this.getNodeWebsocketUrl()
  ): Promise<IBlockchainApi> {
    return Kilt.connect(host)
  }

  public static getNodeWebsocketUrl(): string {
    return `${process.env.REACT_APP_NODE_HOST}`
  }
}

export default BlockchainService
