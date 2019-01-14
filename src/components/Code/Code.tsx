import js_beautify from 'js-beautify'
import * as React from 'react'

import './Code.scss'

type Props = {}

type State = {}

class Code extends React.Component<Props, State> {
  public render() {
    const { children } = this.props
    return (
      <pre className="Code">{js_beautify.js(JSON.stringify(children))}</pre>
    )
  }
}

export default Code
