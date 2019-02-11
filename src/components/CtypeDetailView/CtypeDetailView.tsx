import * as React from 'react'
import { Link } from 'react-router-dom'

import { ICType } from '../../types/Ctype'
import Code from '../Code/Code'

import './CtypeDetailView.scss'

type Props = {
  ctype?: ICType
}

const CtypeDetailView = ({ ctype }: Props) => {
  return (
    <section className="CtypeDetailView">
      {ctype ? (
        <React.Fragment>
          <div className="attributes">
            <div>
              <label>Id</label>
              <div>{ctype._id}</div>
            </div>
            <div>
              <label>Key</label>
              <div>{ctype.key}</div>
            </div>
            <div>
              <label>Name</label>
              <div>{ctype.name}</div>
            </div>
            <div>
              <label>Author</label>
              <div>{ctype.author}</div>
            </div>
            <div>
              <label>Definition</label>
              <div>
                <Code>{ctype.definition}</Code>
              </div>
            </div>
          </div>
          <div className="actions">
            <Link to="/ctype">Cancel</Link>
            <Link to={`/claim/new/${ctype.key}`}>New Claim</Link>
          </div>
        </React.Fragment>
      ) : (
        <div>Given CTYPE key is not valid.</div>
      )}
    </section>
  )
}

export default CtypeDetailView
