import * as React from 'react'
import { Link } from 'react-router-dom'
import CTypeRepository from '../../services/CtypeRepository'

import { ICType, CTypeWithMetadata } from '../../types/Ctype'
import Code from '../Code/Code'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

import './CtypeDetailView.scss'

type Props = {
  cTypeHash: ICType['cType']['hash']
}

type State = {
  cType?: CTypeWithMetadata
}

class CtypeDetailView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    const { cTypeHash } = this.props
    CTypeRepository.findByHash(cTypeHash).then((_cType: CTypeWithMetadata) => {
      this.setState({ cType: _cType })
    })
  }

  public render() {
    const { cTypeHash } = this.props
    const { cType } = this.state

    return (
      <section className="CtypeDetailView">
        {cType ? (
          <React.Fragment>
            <div className="attributes">
              <div>
                <label>Title</label>
                <div>{cType.metaData.metadata.title.default}</div>
              </div>
              <div>
                <label>Author</label>
                <div>
                  <ContactPresentation
                    address={cType.cType.owner!}
                    interactive={true}
                  />
                </div>
              </div>
              <div>
                <label>Definition</label>
                <div>
                  <Code>{cType.cType}</Code>
                </div>
              </div>
              <CTypePresentation cTypeHash={cTypeHash} size={50} />
            </div>
            <div className="actions">
              <Link to="/cType">Cancel</Link>
              <Link to={`/claim/new/${cTypeHash}`}>New Claim</Link>
            </div>
          </React.Fragment>
        ) : (
          <div>Given CTYPE key is not valid.</div>
        )}
      </section>
    )
  }
}

export default CtypeDetailView
