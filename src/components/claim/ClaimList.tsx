import React from 'react'
import { connect } from 'react-redux'

import { ClaimsStateEntry, ImmutableClaimsState } from 'src/state/ducks/Claims'

type Props = {
  claims: ClaimsStateEntry[]
}
type State = {}

class ClaimList extends React.Component<Props, State> {
  public render() {
    const { claims } = this.props

    return (
      <div className="ClaimList">
        <h1>ClaimList</h1>
        <ul>
          {claims.map(claim => (
            <li key={claim.alias}>
              {claim.alias}: {JSON.stringify(claim.claim)}
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

const mapStateToProps = (state: { claims: ImmutableClaimsState }) => {
  return {
    claims: state.claims
      .get('claims')
      .toList()
      .toArray(),
  }
}

export default connect(mapStateToProps)(ClaimList)
