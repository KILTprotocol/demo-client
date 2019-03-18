import {
  ISubmitLegitimations,
  MessageBodyType,
} from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import SelectAttestedClaims from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import * as Claims from '../../../state/ducks/Claims'
import { State as ReduxState } from '../../../state/PersistentStore'
import OnRequestClaimsBase from '../OnRequestClaimsBase/OnRequestClaimsBase'

import './OnRequestLegitimations.scss'

class OnRequestLegitimations extends OnRequestClaimsBase {
  public render() {
    const { cTypeHash } = this.props
    const { workflowStarted, claimSelectionData } = this.state

    return (
      <section className="OnRequestLegitimation">
        {!workflowStarted && (
          <div className="actions">
            <button onClick={this.startWorkflow}>Select legitimation(s)</button>
          </div>
        )}

        {workflowStarted && (
          <div>
            <h4>Select legitimation(s)</h4>

            <SelectAttestedClaims
              cTypeHash={cTypeHash}
              onChange={this.changeClaimSelectionData}
            />

            <div className="actions">
              <button
                disabled={!Object.keys(claimSelectionData).length}
                onClick={this.sendClaim}
              >
                Send Legitimations
              </button>
            </div>
          </div>
        )}
      </section>
    )
  }

  protected createRequest(): ISubmitLegitimations {
    const { sentClaim } = this.props

    return {
      content: {
        claim: sentClaim,
        legitimations: this.getAttestedClaims(),
      },
      type: MessageBodyType.SUBMIT_LEGITIMATIONS,
    } as ISubmitLegitimations
  }
}

const mapStateToProps = (state: ReduxState) => ({
  claimEntries: Claims.getClaims(state),
})

export default connect(mapStateToProps)(OnRequestLegitimations)
