import { Blockchain } from '@kiltprotocol/prototype-sdk'

class BlockchainService {
  public static async connect(
    host: string = this.getNodeWebsocketUrl()
  ): Promise<Blockchain> {
    return Blockchain.build(host)
  }

  public static getNodeWebsocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${process.env.REACT_APP_NODE_HOST}:${
      process.env.REACT_APP_NODE_WS_PORT
    }`
  }
}

export default BlockchainService
