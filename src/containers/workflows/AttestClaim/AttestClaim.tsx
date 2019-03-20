import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import contactRepository from '../../../services/ContactRepository'
import errorService from '../../../services/ErrorService'
import { notifySuccess } from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import { Contact } from '../../../types/Contact'

type Props = {
  claimerAddress: Contact['publicIdentity']['address']
  requestForAttestation: sdk.IRequestForAttestation
  onFinished?: () => void
}

type State = {}

class AttestClaim extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.attestClaim = this.attestClaim.bind(this)
  }

  public render() {
    const { requestForAttestation } = this.props
    return (
      <section className="AttestClaim">
        <ClaimDetailView claim={requestForAttestation.claim} />
        <AttestedClaimsListView
          attestedClaims={requestForAttestation.legitimations}
          context="legitimations"
        />
        <div className="actions">
          <button onClick={this.attestClaim}>Attest Claim</button>
        </div>
      </section>
    )
  }

  private attestClaim() {
    const { requestForAttestation, onFinished, claimerAddress } = this.props

    attestationWorkflow
      .approveAndSubmitAttestationForClaim(
        requestForAttestation,
        claimerAddress
      )
      .then(() => {
        if (onFinished) {
          onFinished()
        }
      })
  }
}

export default AttestClaim
