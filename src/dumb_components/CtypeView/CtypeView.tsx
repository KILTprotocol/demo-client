import * as React from 'react'
import { Link } from 'react-router-dom'

import { CType } from 'src/types/Ctype'

type Props = {
  ctype?: CType
}

const CtypeView = (props: Props) => {
  return props.ctype ? (
    <section className="CtypeView">
      <div>Id: {props.ctype._id}</div>
      <div>Key: {props.ctype.key}</div>
      <div>Name: {props.ctype.name}</div>
      <div>Author: {props.ctype.author}</div>
      <div>Definition: {props.ctype.definition}</div>
      <div>
        <Link to={`/claim/new/${props.ctype.key}`}>New Claim</Link>
      </div>
    </section>
  ) : (
    <section className="CtypeView">Given CTYPE key is not valid.</section>
  )
}

export default CtypeView
