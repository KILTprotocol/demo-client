import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'

import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import FeedbackService, { notifyError } from '../../../services/FeedbackService'
import { IContact } from '../../../types/Contact'
import { BlockUi } from '../../../types/UserFeedback'

type Props = {
  claimerAddresses: Array<IContact['publicIdentity']['address']>
  requestForAttestation: sdk.IRequestForAttestation
  claimer?: sdk.IPublicIdentity

  onCancel?: () => void
  onFinished?: () => void
}

type State = {}

class AttestClaim extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.onCancel = this.onCancel.bind(this)
    this.attestClaim = this.attestClaim.bind(this)
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private attestClaim(): void {
    const {
      requestForAttestation,
      onFinished,
      claimerAddresses,
      claimer,
    } = this.props
    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Writing attestation to chain',
    })

    attestationWorkflow
      .approveAndSubmitAttestationForClaim(
        requestForAttestation,
        claimerAddresses[0],
        claimer
      )
      .then(() => {
        blockUi.remove()
        if (onFinished) {
          onFinished()
        }
      })
      .catch(error => {
        blockUi.remove()
        notifyError(error)
      })
  }

  public render(): JSX.Element {
    const { requestForAttestation } = this.props
    return (
      <section className="AttestClaim">
        <ClaimDetailView claim={requestForAttestation.claim} />

        <AttestedClaimsListView
          attestedClaims={requestForAttestation.legitimations}
          delegationId={requestForAttestation.delegationId}
          context="legitimations"
        />

        <div className="actions">
          <button type="button" onClick={this.onCancel}>
            Cancel
          </button>
          <button type="button" onClick={this.attestClaim}>
            Attest Claim
          </button>
        </div>
      </section>
    )
  }
}

export default AttestClaim
