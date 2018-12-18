import * as React from 'react'

import { CType } from 'src/types/Ctype'
import ctypeRepository from '../../services/CtypeRepository'

type Props = {
  ctypeKey: string
}

type State = {
  ctype?: CType
}

class CtypeViewComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {}
  }

  public componentDidMount() {
    void this.init()
  }

  public render() {
    const { ctype } = this.state

    if (!ctype) {
      return null
    }

    return (
      <div>
        <div>Id: {ctype._id}</div>
        <div>Key: {ctype.key}</div>
        <div>Name: {ctype.name}</div>
        <div>Author: {ctype.author}</div>
        <div>Definition: {JSON.stringify(ctype.definition)}</div>
      </div>
    )
  }

  private async init() {
    const ctype = await ctypeRepository.findByKey(this.props.ctypeKey)
    this.setState({ ctype })
  }
}

export default CtypeViewComponent
