import { ApiPromise } from '@polkadot/api'
import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'
import If from '../../common/If'
import blockchainService from '../../services/BlockchainService'

type Props = RouteComponentProps<{
  host: string
}>
type State = {
  host: string
  chainName?: string
  chainVersion?: string
  chainType?: string
}

class ChainStatsComponent extends React.Component<Props, State> {
  private api: ApiPromise

  private mounted = false

  constructor(props: Props) {
    super(props)

    this.state = {
      host: decodeURIComponent(this.props.match.params.host),
    }
  }

  public componentDidMount() {
    this.mounted = true
    void this.connect()
  }

  public async connect() {
    // TODO: test unmount and host change
    // TODO: test error handling
    this.api = await blockchainService.connect(this.state.host)

    const [name, version, type] = await Promise.all([
      this.api.rpc.system.name(),
      this.api.rpc.system.version(),
      this.api.rpc.system.chain(),
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
    const { host, chainName, chainVersion, chainType } = this.state

    return (
      <div>
        <h1 className="App-title">Chain Stats</h1>
        Demo module to interact with substrate blockchain
        <hr />
        <If
          condition={!!host}
          then={
            <div>
              <div>Host: {host}</div>
              <If condition={!!chainName} then={<div>Name: {chainName}</div>} />
              <If
                condition={!!chainVersion}
                then={<div>Version: {chainVersion}</div>}
              />
              <If condition={!!chainType} then={<div>Type: {chainType}</div>} />
            </div>
          }
          else={'No Host given'}
        />
      </div>
    )
  }
}

export default withRouter(ChainStatsComponent)
