import * as React from 'react'
import ReactJson from 'react-json-view'

import './Code.scss'

type Props = {
  collapsed?: boolean | number
}

type State = {}

class Code extends React.Component<Props, State> {
  public render() {
    const { children, collapsed } = this.props
    let output: string | number

    if (children && typeof children === 'object') {
      return (
        <ReactJson
          src={children as object}
          name={false}
          theme="monokai"
          collapsed={collapsed != null ? collapsed : 1}
          collapseStringsAfterLength={30}
          enableClipboard={false}
          displayDataTypes={false}
        />
      )
    } else {
      switch (typeof children) {
        case 'undefined':
          output = 'undefined'
          break
        case 'boolean':
          output = children ? 'true' : 'false'
          break
        case 'string':
          output = children as string
          break
        case 'number':
          output = children as number
          break
        case 'symbol':
          output = 'symbol'
          break
        case 'function':
          output = 'function'
          break
        default:
          output = 'null'
      }
      return <pre className="Code">{output}</pre>
    }
  }
}

export default Code
