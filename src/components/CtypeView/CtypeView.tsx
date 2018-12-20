import * as React from 'react'
import { Link } from 'react-router-dom'

import { CType } from 'src/types/Ctype'
import ctypeRepository from '../../services/CtypeRepository'

type Props = {
  ctypeKey: string
}

type State = {
  ctype?: CType
}

class CtypeView extends React.Component<Props, State> {
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
        <div>Definition: {ctype.definition}</div>
        <div>
          <Link to={`/claim/new/${ctype.key}`}>New Claim</Link>
        </div>
      </div>
    )
  }

  private async init() {
    const ctype = await ctypeRepository.findByKey(this.props.ctypeKey)
    this.setState({ ctype })
  }
}

export default CtypeView
