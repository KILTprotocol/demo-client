import js_beautify from 'js-beautify'
import * as React from 'react'

import './Code.scss'

type Props = {}

type State = {}

class Code extends React.Component<Props, State> {
  public render() {
    const { children } = this.props

    let stringified = children as string
    if (typeof children === 'object') {
      stringified = JSON.stringify(children)
    }

    return <pre className="Code">{js_beautify.js(stringified)}</pre>
  }
}

export default Code
