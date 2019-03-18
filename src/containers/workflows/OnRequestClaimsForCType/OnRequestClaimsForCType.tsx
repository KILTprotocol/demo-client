import {
  ISubmitClaimsForCtype,
  MessageBodyType,
} from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import SelectAttestedClaims from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import OnRequestClaimsBase from '../OnRequestClaimsBase/OnRequestClaimsBase'

import './OnRequestClaimsForCType.scss'

class OnRequestClaimsForCType extends OnRequestClaimsBase {
  public render() {
    const { cTypeHash } = this.props
    const { workflowStarted, claimSelectionData } = this.state

    return (
      <section className="OnRequestClaimsForCType">
        {!workflowStarted && (
          <div className="actions">
            <button onClick={this.startWorkflow}>
              Select attested claim(s)
            </button>
          </div>
        )}

        {workflowStarted && (
          <div>
            <h4>Select attested claim(s)</h4>

            <SelectAttestedClaims
              cTypeHash={cTypeHash}
              onChange={this.changeClaimSelectionData}
            />

            <div className="actions">
              <button
                disabled={!Object.keys(claimSelectionData).length}
                onClick={this.sendClaim}
              >
                Send attested claim
              </button>
            </div>
          </div>
        )}
      </section>
    )
  }

  protected createRequest(): ISubmitClaimsForCtype {
    return {
      content: this.getAttestedClaims(),
      type: MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE,
    } as ISubmitClaimsForCtype
  }
}

export default OnRequestClaimsForCType
