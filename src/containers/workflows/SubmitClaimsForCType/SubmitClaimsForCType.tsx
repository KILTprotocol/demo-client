import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import SelectAttestedClaims from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import withSelectAttestedClaims, {
  InjectedProps as InjectedSelectProps,
} from '../../../components/withSelectAttestedClaims/withSelectAttestedClaims'
import MessageRepository from '../../../services/MessageRepository'
import {
  MyDelegation,
  MyRootDelegation,
} from '../../../state/ducks/Delegations'
import { Contact } from '../../../types/Contact'

import './SubmitClaimsForCType.scss'

type Props = InjectedSelectProps & {
  cTypeHash: sdk.ICType['hash']
  receiverAddress: Contact['publicIdentity']['address']

  onFinished?: () => void
}

type State = {
  selectedDelegation?: MyDelegation | MyRootDelegation
}

class SubmitClaimsForCType extends React.Component<Props, State> {
  public render() {
    const {
      cTypeHash,
      onStartWorkflow,
      workflowStarted,
      claimSelectionData,
      onChange,
    } = this.props

    return (
      <section className="SubmitClaimsForCType">
        {!workflowStarted && (
          <div className="actions">
            <button onClick={onStartWorkflow}>Select attested claim(s)</button>
          </div>
        )}

        {workflowStarted && (
          <div>
            <h4>Select attested claim(s)</h4>

            <SelectAttestedClaims cTypeHash={cTypeHash} onChange={onChange} />

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

  private sendClaim() {
    const { receiverAddress, onFinished, getAttestedClaims } = this.props
    const messageBody: sdk.ISubmitClaimsForCtype = {
      content: getAttestedClaims(),
      type: sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE,
    }

    MessageRepository.sendToAddress(receiverAddress, messageBody).then(() => {
      if (onFinished) {
        onFinished()
      }
    })
  }
}

export default withSelectAttestedClaims(SubmitClaimsForCType)
