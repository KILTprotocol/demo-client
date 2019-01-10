import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'

import ClaimDetailView from '../../components/ClaimDetailView/ClaimDetailView'
import ClaimListView from '../../components/ClaimListView/ClaimListView'
import * as Claims from '../../state/ducks/Claims'

type Props = RouteComponentProps<{ id: string }> & {
  claims: Claims.Entry[]
  removeClaim: (id: string) => void
}

type State = {}

class ClaimView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.deleteClaim = this.deleteClaim.bind(this)
  }

  public render() {
    const { id } = this.props.match.params
    const { claims } = this.props
    let currentClaim
    if (id) {
      currentClaim = this.getCurrentClaim()
    }
    return (
      <section className="ClaimView">
        {!!id && (
          <ClaimDetailView
            claim={currentClaim}
            removeClaim={this.deleteClaim}
          />
        )}
        {!id && (
          <ClaimListView claims={claims} removeClaim={this.deleteClaim} />
        )}
      </section>
    )
  }

  private getCurrentClaim(): Claims.Entry | undefined {
    const { id } = this.props.match.params
    const { claims } = this.props
    return claims.find((claim: Claims.Entry) => claim.id === id)
  }

  private deleteClaim(id: string) {
    const { removeClaim } = this.props
    removeClaim(id)
    this.props.history.push('/claim')
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

const mapDispatchToProps = (dispatch: (action: Claims.Action) => void) => {
  return {
    removeClaim: (id: string) => {
      dispatch(Claims.Store.removeAction(id))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(ClaimView))
