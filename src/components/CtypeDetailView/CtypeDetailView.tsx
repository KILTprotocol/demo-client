import * as React from 'react'
import { Link } from 'react-router-dom'

import { ICType } from '../../types/Ctype'
import Code from '../Code/Code'

import './CtypeDetailView.scss'

type Props = {
  cType?: ICType
}

const CtypeDetailView = ({ cType }: Props) => {
  return (
    <section className="CtypeDetailView">
      {cType ? (
        <React.Fragment>
          <div className="attributes">
            <div>
              <label>Title</label>
              <div>{cType.cType.metadata.title.default}</div>
            </div>
            <div>
              <label>Author</label>
              <div>{cType.metaData.author}</div>
            </div>
            <div>
              <label>Definition</label>
              <div>
                <Code>{JSON.stringify(cType.cType)}</Code>
              </div>
            </div>
          </div>
          <div className="actions">
            <Link to="/cType">Cancel</Link>
            <Link to={`/claim/new/${cType.cType.hash}`}>New Claim</Link>
          </div>
        </React.Fragment>
      ) : (
        <div>Given CTYPE key is not valid.</div>
      )}
    </section>
  )
}

export default CtypeDetailView
