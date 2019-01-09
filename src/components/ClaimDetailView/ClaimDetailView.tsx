import React from 'react'
import { Link } from 'react-router-dom'
import * as Claims from '../../state/ducks/Claims'

type Props = {
  claim?: Claims.Entry
}

const ClaimDetailView = ({ claim }: Props) => {
  return claim ? (
    <section className="ClaimDetailView">
      <h1>{claim.alias}</h1>
      <Link to="/claim">Go back</Link>
      <hr />
      <div>Id: {claim.id}</div>
      <div>Contents: {JSON.stringify(claim.claim.contents)}</div>
    </section>
  ) : (
    <section className="ClaimDetailView">Claim not found</section>
  )
}

export default ClaimDetailView
