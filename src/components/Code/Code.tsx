import * as React from 'react'
import ReactJson from 'react-json-view'

import './Code.scss'

type Props = {}

type State = {}

class Code extends React.Component<Props, State> {
  public render() {
    const { children } = this.props
    return (
      <ReactJson
        src={children as object}
        name={false}
        theme="monokai"
        collapsed={true}
        collapseStringsAfterLength={30}
        enableClipboard={false}
        displayDataTypes={false}
      />
    )
  }
}

export default Code
