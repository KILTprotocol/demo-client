import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import * as Claims from '../../state/ducks/Claims'

type Props = {
  claims: Claims.Entry[]
}
type State = {}

class ClaimList extends React.Component<Props, State> {
  public render() {
    const { claims } = this.props

    return (
      <section className="ClaimList">
        <h1>My Claims</h1>
        <ul>
          {!!claims.length &&
            claims.map(claim => (
              <li key={claim.alias}>
                {claim.alias}: {JSON.stringify(claim.claim)}
              </li>
            ))}
          {!claims.length && (
            <li>
              No claims found. You might want to start with{' '}
              <Link to="/ctype/new">creating a new CTYPE</Link>.
            </li>
          )}
        </ul>
      </section>
    )
  }
}

const mapStateToProps = (state: { claims: Claims.ImmutableState }) => {
  return {
    claims: state.claims
      .get('claims')
      .toList()
      .toArray(),
  }
}

export default connect(mapStateToProps)(ClaimList)
