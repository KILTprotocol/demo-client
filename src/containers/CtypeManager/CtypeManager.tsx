import * as React from 'react'
import {
  Link,
  Route,
  RouteComponentProps,
  Switch,
  withRouter,
} from 'react-router-dom'

import CtypeView from '../../components/CtypeView/CtypeView'
import CtypeRepository from '../../services/CtypeRepository'
import { CType } from '../../types/Ctype'

type Props = RouteComponentProps<{ ctypeKey: string }> & {}

type State = {
  ctypes: CType[]
  currentCtype?: CType
}

class CtypeManager extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      ctypes: [],
    }
  }

  public componentDidMount() {
    void this.init()

    if (this.props.match.params.ctypeKey) {
      this.getCurrentCtype()
    }
  }

  public render() {
    // List view
    const list = this.state.ctypes.map(ctype => (
      <li key={ctype.key}>
        <Link to={`/ctype/${ctype.key}`}>
          {ctype.author}: {ctype.name}
        </Link>
      </li>
    ))
    const listComponent = () => (
      <React.Fragment>
        <Link to="/ctype/new">Create new CTYPE</Link>
        <ul>{list}</ul>
      </React.Fragment>
    )

    // detail view
    const viewComponent = () => {
      return (
        <React.Fragment>
          <Link to="/ctype">Go back</Link>
          <CtypeView ctype={this.state.currentCtype} />
        </React.Fragment>
      )
    }

    return (
      <section className="CtypeManager">
        <h1>Registry CTYPES</h1>
        <Switch>
          <Route path={'/ctype/:ctypeKey'} render={viewComponent} />
          <Route render={listComponent} />
        </Switch>
      </section>
    )
  }

  private async init() {
    const ctypes = await CtypeRepository.findAll()
    this.setState({ ctypes })
  }

  private getCurrentCtype() {
    const currentCtype = this.state.ctypes.find(
      (ctype: CType) => ctype.key === this.props.match.params.ctypeKey
    )
    this.setState({ currentCtype })
  }
}

export default withRouter(CtypeManager)
