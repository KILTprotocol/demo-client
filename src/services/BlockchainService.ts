import { Blockchain } from '@kiltprotocol/prototype-sdk'

class BlockchainService {
  public static async connect(
    host: string = 'ws://127.0.0.1:9944'
  ): Promise<Blockchain> {
    // TODO: select host: 'ws://127.0.0.1:9944' or boot node? depending on environment
    return Blockchain.build(host)
  }
}

export default BlockchainService
