import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Link, Route, Switch } from 'react-router-dom'

import ctypeRepository from '../../services/CtypeRepository'
import { CType } from '../../types/Ctype'
import CtypeViewComponent from './CtypeViewComponent'

type Props = {}

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
    const list = this.state.ctypes.map(ctype => (
      <li key={ctype.key}>
        <Link to={`/ctype/${ctype.key}`}>
          {ctype.author}: {ctype.name}
        </Link>
      </li>
    ))

    const viewComponent = ({
      match,
    }: RouteComponentProps<{ ctypeKey: string }>) => (
      <React.Fragment>
        <Link to="/ctype">Go back</Link>
        <CtypeViewComponent ctypeKey={match.params.ctypeKey} />
      </React.Fragment>
    )
    const listComponent = () => (
      <React.Fragment>
        <Link to="/ctype/new">Create new CTYPE</Link>
        <ul>{list}</ul>
      </React.Fragment>
    )

    return (
      <div>
        <h1 className="App-title">Ctype Manager</h1>
        <Switch>
          <Route path={'/ctype/:ctypeKey'} render={viewComponent} />
          <Route render={listComponent} />
        </Switch>
      </div>
    )
  }

  private async init() {
    const ctypes = await ctypeRepository.findAll()
    this.setState({ ctypes })
  }
}

export default CtypeManagerComponent
