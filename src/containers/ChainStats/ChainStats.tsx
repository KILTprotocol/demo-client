import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'
import If from '../../common/If'
import BlockchainService from '../../services/BlockchainService'
import { Blockchain } from '@kiltprotocol/prototype-sdk'

type Props = RouteComponentProps<{
  host: string
}>
type State = {
  chainName?: string
  chainVersion?: string
  chainType?: string
}

class ChainStats extends React.Component<Props, State> {
  private blockchain: Blockchain

  private mounted = false

  private nodeWebsocketAddress: string

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    this.mounted = true
    void this.connect()
  }

  public async connect() {
    // TODO: test unmount and host change
    // TODO: test error handling
    this.nodeWebsocketAddress = BlockchainService.getNodeWebsocketUrl()
    this.blockchain = await BlockchainService.connect()

    const [name, version, type] = await Promise.all([
      this.blockchain.api.rpc.system.name(),
      this.blockchain.api.rpc.system.version(),
      this.blockchain.api.rpc.system.chain(),
    ])

    if (this.mounted) {
      this.setState({
        chainName: name.toString(),
        chainType: type.toString(),
        chainVersion: version.toString(),
      })
    }
  }

  public componentWillUnmount() {
    this.mounted = false
  }

  public render() {
    const { chainName, chainVersion, chainType } = this.state

    return (
      <section className="ChainStats">
        <h1>Chain Stats</h1>
        Demo module to interact with substrate blockchain
        <hr />
        <div>
          <If condition={!chainName} then={<div>Connecting...</div>} />
          <If condition={!!chainName} then={<div>Blockchain node: {this.nodeWebsocketAddress}</div>} />
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
