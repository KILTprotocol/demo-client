import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import FeedbackService, { notifyError } from '../../../services/FeedbackService'
import { Contact } from '../../../types/Contact'
import { BlockUi } from '../../../types/UserFeedback'

type Props = {
  claimerAddresses: Array<Contact['publicIdentity']['address']>
  requestForAttestation: sdk.IRequestForAttestation

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

  public render() {
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
          <button onClick={this.onCancel}>Cancel</button>
          <button onClick={this.attestClaim}>Attest Claim</button>
        </div>
      </section>
    )
  }

  private onCancel() {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private attestClaim() {
    const { requestForAttestation, onFinished, claimerAddresses } = this.props
    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Writing attestation to chain',
    })

    attestationWorkflow
      .approveAndSubmitAttestationForClaim(
        requestForAttestation,
        claimerAddresses[0]
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
}

export default AttestClaim
