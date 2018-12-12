import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import If from '../../common/If'
import ctypeRepository from '../../services/CtypeRepository'
import { CType } from '../../types/Ctype'

type Props = RouteComponentProps<{
  hash?: string
}>

type State = {
  ctypes: CType[]
}

class CtypeComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      ctypes: [],
    }
  }

  public componentDidMount() {
    void this.init()
  }

  public render() {
    const hash = this.props.match.params.hash

    const list = this.state.ctypes.map(ctype => (
      <li key={ctype.key}>
        <Link to={`/ctype/${ctype.key}`}>{ctype.key}</Link>
      </li>
    ))

    return (
      <div>
        <h1 className="App-title">Ctype Manager</h1>
        <If
          condition={!!hash}
          then={<div>Current hash: {hash}</div>}
          else={<ul>{list}</ul>}
        />
      </div>
    )
  }

  private async init() {
    const ctypes = await ctypeRepository.findAll()
    this.setState({ ctypes })
  }
}

export default withRouter(CtypeComponent)
