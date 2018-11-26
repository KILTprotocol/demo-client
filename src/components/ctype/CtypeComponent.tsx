import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import If from '../../common/If'

type Props = RouteComponentProps<{
  hash?: string
}>

class CtypeComponent extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const hash = this.props.match.params.hash
    return (
      <div>
        <h1 className="App-title">Ctype Manager</h1>
        <If
          condition={!!hash}
          then={<div>Current hash: {hash}</div>}
          else={
            <ul>
              <li>
                <Link to={'/ctype/123'}>CTYPE 123</Link>
              </li>
              <li>
                <Link to={'/ctype/ABC'}>CTYPE ABC</Link>
              </li>
            </ul>
          }
        />
      </div>
    )
  }
}

export default withRouter(CtypeComponent)
