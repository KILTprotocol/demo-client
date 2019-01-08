import React from 'react'
import { connect } from 'react-redux'

import ClaimListView from '../../components/ClaimListView/ClaimListView'
import * as Claims from '../../state/ducks/Claims'

type Props = {
  claims: Claims.Entry[]
}
type State = {}

class ClaimView extends React.Component<Props, State> {
  public render() {
    const { claims } = this.props
    return <ClaimListView claims={claims} />
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

export default connect(mapStateToProps)(ClaimView)
