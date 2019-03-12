import Identicon from '@polkadot/ui-identicon'
import * as React from 'react'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import CTypeRepository from '../../services/CtypeRepository'
import { ICType } from '../../types/Ctype'

import './CTypePresentation.scss'

type Props = {
  cType?: ICType
  cTypeHash?: ICType['cType']['hash']
  inline?: true
  size?: number
  linked?: false
}

type State = {
  cType?: ICType
}

const DEFAULT_SIZE = 24

class CTypePresentation extends React.Component<Props, State> {
  private static defaultProps = {
    linked: true,
  }

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    this.setCType()
  }

  public componentDidUpdate(nextProps: Props) {
    if (nextProps !== this.props) {
      this.setCType()
    }
  }

  public render() {
    const { inline, size } = this.props
    const { cType } = this.state

    const classes = ['CTypePresentation', inline ? 'inline' : '']

    return (
      <div className={classes.join(' ')}>
        {cType &&
          cType.cType &&
          this.wrapInLink(
            <React.Fragment>
              <Identicon
                value={cType.cType.hash}
                size={size || DEFAULT_SIZE}
                theme="polkadot"
              />
              <span className="label">
                {cType.cType.metadata.title.default}
              </span>
            </React.Fragment>
          )}
      </div>
    )
  }

  private wrapInLink(content: ReactNode) {
    const { linked } = this.props
    const { cType } = this.state
    if (!linked || !cType) {
      return <span>{content}</span>
    }
    return <Link to={`/ctype/${cType.cType.hash}`}>{content}</Link>
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
