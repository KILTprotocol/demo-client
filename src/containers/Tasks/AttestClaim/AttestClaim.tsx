import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'

import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import FeedbackService, { notifyError } from '../../../services/FeedbackService'
import { IContact } from '../../../types/Contact'
import { BlockUi } from '../../../types/UserFeedback'
import Code from '../../../components/Code/Code'

type Props = {
  claimerAddresses: Array<IContact['publicIdentity']['address']>
  requestForAttestation: sdk.IRequestForAttestation
  quote?: sdk.IQuoteAgreement
  onCancel?: () => void
  onFinished?: () => void
}

type State = {
  quote?: sdk.IQuoteAgreement
}

class AttestClaim extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.onCancel = this.onCancel.bind(this)
    this.attestClaim = this.attestClaim.bind(this)
  }

  componentDidMount(): void {
    const { quote } = this.props
    if (quote) {
      this.setState({ quote })
    }
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private attestClaim(): void {
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

  public render(): JSX.Element {
    const { requestForAttestation } = this.props
    const { quote } = this.state
    return (
      <section className="AttestClaim">
        <ClaimDetailView claim={requestForAttestation.claim} />

        <AttestedClaimsListView
          attestedClaims={requestForAttestation.legitimations}
          delegationId={requestForAttestation.delegationId}
          context="terms"
        />
        {!quote ? (
          <span>
            <h2>Quotes</h2>
            <div>no Quote</div>
          </span>
        ) : (
          <span>
            <h2>Quotes</h2>
            <div>
              <Code>{quote}</Code>
            </div>
          </span>
        )}

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
