import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import SelectAttestedClaims from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import SelectDelegations from '../../../components/SelectDelegations/SelectDelegations'
import withSelectAttestedClaims, {
  InjectedProps as InjectedSelectProps,
} from '../../../components/withSelectAttestedClaims/withSelectAttestedClaims'
import MessageRepository from '../../../services/MessageRepository'
import {
  MyDelegation,
  MyRootDelegation,
} from '../../../state/ducks/Delegations'
import { Contact } from '../../../types/Contact'

import './SubmitLegitimations.scss'

type Props = InjectedSelectProps & {
  sentClaim: sdk.IPartialClaim
  receiverAddress: Contact['publicIdentity']['address']

  onFinished?: () => void
}

type State = {
  selectedDelegation?: MyDelegation | MyRootDelegation
}

class SubmitLegitimations extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.changeDelegation = this.changeDelegation.bind(this)
    this.createMessageBody = this.createMessageBody.bind(this)
    this.sendClaim = this.sendClaim.bind(this)
  }

  public render() {
    const {
      sentClaim,
      onStartWorkflow,
      workflowStarted,
      claimSelectionData,
      onChange,
    } = this.props

    const { selectedDelegation } = this.state

    return (
      <section className="SubmitLegitimations">
        {!workflowStarted && (
          <div className="actions">
            <button onClick={onStartWorkflow}>Select legitimation(s)</button>
          </div>
        )}

        {workflowStarted && (
          <>
            <div className="selectLegitimations">
              <h4>Select legitimation(s)</h4>
              <SelectAttestedClaims
                cTypeHash={sentClaim.cType}
                onChange={onChange}
              />
            </div>

            <div className="selectDelegation">
              <h4>Select Delegation</h4>
              <SelectDelegations
                isMulti={false}
                onChange={this.changeDelegation}
              />
            </div>

            <div className="actions">
              <button
                disabled={
                  !Object.keys(claimSelectionData).length && !selectedDelegation
                }
                onClick={this.sendClaim}
              >
                Send Legitimations
              </button>
            </div>
          </>
        )}
      </section>
    )
  }

  private sendClaim() {
    const { receiverAddress, onFinished } = this.props
    MessageRepository.sendToAddress(
      receiverAddress,
      this.createMessageBody()
    ).then(() => {
      if (onFinished) {
        onFinished()
      }
    })
  }

  private createMessageBody(): sdk.ISubmitLegitimations {
    const { sentClaim, getAttestedClaims } = this.props
    const { selectedDelegation } = this.state

    const messageBody: sdk.ISubmitLegitimations = {
      content: {
        claim: sentClaim,
        legitimations: getAttestedClaims(),
      },
      type: sdk.MessageBodyType.SUBMIT_LEGITIMATIONS,
    }

    if (selectedDelegation) {
      messageBody.content.delegationId = selectedDelegation.id
    }

    return messageBody
  }

  private changeDelegation(selectedDelegations: MyDelegation[]) {
    this.setState({ selectedDelegation: selectedDelegations[0] })
  }
}

export default withSelectAttestedClaims(SubmitLegitimations)
