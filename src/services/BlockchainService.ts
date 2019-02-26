import { Blockchain } from '@kiltprotocol/prototype-sdk'

class BlockchainService {
  public static instance: Promise<Blockchain>

  public static async connect(
    host: string = this.getNodeWebsocketUrl()
  ): Promise<Blockchain> {
    if (!BlockchainService.instance) {
      BlockchainService.instance = Blockchain.build(host)
    }
    return BlockchainService.instance
  }

  public static getNodeWebsocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${process.env.REACT_APP_NODE_HOST}:${
      process.env.REACT_APP_NODE_WS_PORT
    }`
  }
}

export default BlockchainService
