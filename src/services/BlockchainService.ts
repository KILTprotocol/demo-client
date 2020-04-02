import Kilt, { IBlockchainApi } from '@kiltprotocol/sdk-js'

class BlockchainService {
  public static instance: Promise<IBlockchainApi>

  public static async connect(
    host: string = this.getNodeWebsocketUrl()
  ): Promise<IBlockchainApi> {
    return Kilt.connect(host)
  }

  public static getNodeWebsocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${process.env.REACT_APP_NODE_HOST}:${process.env.REACT_APP_NODE_WS_PORT}`
  }
}

export default BlockchainService
