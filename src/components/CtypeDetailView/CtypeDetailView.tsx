import * as React from 'react'
import { Link } from 'react-router-dom'

import { CType } from 'src/types/Ctype'

type Props = {
  ctype?: CType
}

const CtypeDetailView = ({ ctype }: Props) => {
  return ctype ? (
    <section className="CtypeDetailView">
      <Link to="/ctype">Go back</Link>
      <hr />
      <div>Id: {ctype._id}</div>
      <div>Key: {ctype.key}</div>
      <div>Name: {ctype.name}</div>
      <div>Author: {ctype.author}</div>
      <div>Definition: {ctype.definition}</div>
      <div>
        <Link to={`/claim/new/${ctype.key}`}>New Claim</Link>
      </div>
    </section>
  ) : (
    <section className="CtypeDetailView">Given CTYPE key is not valid.</section>
  )
}

export default CtypeDetailView
