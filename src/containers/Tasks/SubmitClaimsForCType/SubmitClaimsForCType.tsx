import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import SelectAttestedClaims from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import withSelectAttestedClaims, {
  InjectedProps as InjectedSelectProps,
} from '../../../components/withSelectAttestedClaims/withSelectAttestedClaims'
import AttestationWorkflow from '../../../services/AttestationWorkflow'
import { MyDelegation } from '../../../state/ducks/Delegations'
import { Contact } from '../../../types/Contact'

import './SubmitClaimsForCType.scss'

export type SubmitClaimsForCTypeProps = {
  cTypeHash: sdk.ICType['hash']
  receiverAddresses: Array<Contact['publicIdentity']['address']>

  autoStart?: true

  onFinished?: () => void
}

type Props = InjectedSelectProps & SubmitClaimsForCTypeProps

type State = {
  selectedDelegation?: MyDelegation
}

class SubmitClaimsForCType extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.sendClaim = this.sendClaim.bind(this)
  }

  public render() {
    const {
      cTypeHash,
      workflowStarted,
      claimSelectionData,

      autoStart,

      onStartWorkflow,
      onChange,
    } = this.props

    const _workFlowStarted = autoStart || workflowStarted

    return (
      <section className="SubmitClaimsForCType">
        {!_workFlowStarted && (
          <div className="actions">
            <button onClick={onStartWorkflow}>Select attested claim(s)</button>
          </div>
        )}
        {_workFlowStarted && (
          <div className="selectAttestedClaims">
            <h4>Select attested claim(s)</h4>

            <SelectAttestedClaims cTypeHash={cTypeHash} onChange={onChange} />

            <div className="actions">
              <button
                disabled={!Object.keys(claimSelectionData).length}
                onClick={this.sendClaim}
              >
                Send attested claims
              </button>
            </div>
          </div>
        )}
      </section>
    )
  }

  private sendClaim() {
    const { receiverAddresses, onFinished, getAttestedClaims } = this.props

    AttestationWorkflow.submitClaimsForCtype(
      getAttestedClaims(),
      receiverAddresses[0]
    ).then(() => {
      if (onFinished) {
        onFinished()
      }
    })
  }
}

export default withSelectAttestedClaims(SubmitClaimsForCType)
