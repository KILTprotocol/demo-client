import * as React from 'react'
import ReactJsonView from 'react-json-view'

import './Code.scss'

type Props = {
  collapsed?: boolean | number
}

type State = {}

class Code extends React.Component<Props, State> {
  public render() {
    const { children, collapsed } = this.props

    if (children && typeof children === 'object') {
      return (
        <ReactJsonView
          src={children as object}
          name={false}
          theme="monokai"
          collapsed={collapsed != null ? collapsed : 1}
          collapseStringsAfterLength={30}
          enableClipboard={true}
          displayDataTypes={false}
        />
      )
    } else {
      return <pre className="Code">{String(children)}</pre>
    }
  }
}

export default Code
