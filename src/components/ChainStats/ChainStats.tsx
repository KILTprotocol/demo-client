import React from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'
import { Text } from '@polkadot/types'

import { IBlockchainApi } from '@kiltprotocol/sdk-js'
import If from '../../common/If'
import BlockchainService from '../../services/BlockchainService'

type Props = RouteComponentProps<{
  host: string
}>
type State = {
  chainName?: string
  chainVersion?: string
  chainType?: string
}

class ChainStats extends React.Component<Props, State> {
  private blockchain: IBlockchainApi

  private mounted = false

  private nodeWebsocketAddress: string

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount(): void {
    this.mounted = true
    this.connect()
  }

  public componentWillUnmount(): void {
    this.mounted = false
  }

  public async connect(): Promise<void> {
    // TODO: test unmount and host change
    // TODO: test error handling
    this.nodeWebsocketAddress = BlockchainService.getNodeWebsocketUrl()
    this.blockchain = await BlockchainService.connect()

    const [name, version, type] = await Promise.all([
      this.blockchain.api.rpc.system.name<Text>(),
      this.blockchain.api.rpc.system.version<Text>(),
      this.blockchain.api.rpc.system.chain<Text>(),
    ])

    if (this.mounted) {
      this.setState({
        chainName: name.toString(),
        chainType: type.toString(),
        chainVersion: version.toString(),
      })
    }
  }

  public render(): JSX.Element {
    const { chainName, chainVersion, chainType } = this.state

    return (
      <section className="ChainStats">
        <h2>Chain Stats</h2>
        <div>
          Demo module to interact with substrate blockchain
          <hr />
          <If condition={!chainName} then={<div>Connecting...</div>} />
          <If
            condition={!!chainName}
            then={<div>Blockchain node: {this.nodeWebsocketAddress}</div>}
          />
          <If condition={!!chainName} then={<div>Name: {chainName}</div>} />
          <If
            condition={!!chainVersion}
            then={<div>Version: {chainVersion}</div>}
          />
          <If condition={!!chainType} then={<div>Type: {chainType}</div>} />
        </div>
      </section>
    )
  }
}

export default withRouter(ChainStats)
