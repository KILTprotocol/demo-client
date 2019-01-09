import React from 'react'
import { connect } from 'react-redux'

import ClaimListView from '../../components/ClaimListView/ClaimListView'
import * as Claims from '../../state/ducks/Claims'
import { RouteComponentProps } from 'react-router'
import ClaimDetailView from 'src/components/ClaimDetailView/ClaimDetailView'

type Props = RouteComponentProps<{ id: string }> & {
  claims: Claims.Entry[]
}

type State = {}

class ClaimView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      currentClaim: undefined,
    }
  }

  public render() {
    const { id } = this.props.match.params
    let currentClaim
    if (id) {
      currentClaim = this.getCurrentClaim()
    }
    return (
      <section className="ClaimView">
        {!!id && <ClaimDetailView claim={currentClaim} />}
        {!id && <ClaimListView claims={this.props.claims} />}
      </section>
    )
  }

  private getCurrentClaim(): Claims.Entry | undefined {
    return this.props.claims.find(
      (claim: Claims.Entry) => claim.id === this.props.match.params.id
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

export default connect(mapStateToProps)(ClaimView)
