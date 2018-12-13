import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import If from '../../common/If'
import ctypeRepository from '../../services/CtypeRepository'
import { CType } from '../../types/Ctype'
import CtypeViewComponent from './CtypeViewComponent'

type Props = RouteComponentProps<{
  ctypeKey?: string
}>

type State = {
  ctypes: CType[]
}

class CtypeManagerComponent extends React.Component<Props, State> {
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
    const ctypeKey = this.props.match.params.ctypeKey

    const list = this.state.ctypes.map(ctype => (
      <li key={ctype.key}>
        <Link to={`/ctype/${ctype.key}`}>{ctype.key}</Link>
      </li>
    ))

    return (
      <div>
        <h1 className="App-title">Ctype Manager</h1>
        <If
          condition={!!ctypeKey}
          then={<CtypeViewComponent ctypeKey={ctypeKey as string} />}
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

export default withRouter(CtypeManagerComponent)
