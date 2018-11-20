import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'

type Props = RouteComponentProps<{
  ip: string
}>

class ChainStatsComponent extends React.Component<Props, {}> {

  constructor(props: Props) {
    super(props)
  }

  public render() {
    // const ip = this.props.match.params.ip
    return (
      <div>
        <h1 className="App-title">Chain Stats</h1>
        Demo module to interact with substrate blockchain
      </div>
    )
  }
}

export default withRouter(ChainStatsComponent)
