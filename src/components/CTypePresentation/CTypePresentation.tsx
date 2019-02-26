import Identicon from '@polkadot/ui-identicon'
import * as React from 'react'

import CTypeRepository from '../../services/CtypeRepository'
import { ICType } from '../../types/Ctype'

import './CTypePresentation.scss'

type Props = {
  cType?: ICType
  cTypeHash?: ICType['cType']['hash']
  iconOnly?: boolean
  size?: number
}

type State = {
  cType?: ICType
}

const DEFAULT_SIZE = 24

class CTypePresentation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    this.setCType()
  }

  public render() {
    const { iconOnly, size } = this.props
    const { cType } = this.state

    return (
      <div className="CTypePresentation">
        {cType && (
          <Identicon
            value={cType.cType.hash}
            size={size || DEFAULT_SIZE}
            theme="polkadot"
          />
        )}
        {cType && !iconOnly && (
          <span className="name">{cType.cType.metadata.title.default}</span>
        )}
      </div>
    )
  }

  private setCType() {
    const { cType, cTypeHash } = this.props

    if (cType) {
      this.setState({ cType })
    } else {
      CTypeRepository.findByHash(cTypeHash).then((_cType: ICType) => {
        this.setState({ cType: _cType })
      })
    }
  }
}

export default CTypePresentation
