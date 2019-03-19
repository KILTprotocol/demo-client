import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import contactRepository from '../../../services/ContactRepository'
import errorService from '../../../services/ErrorService'
import { notifySuccess } from '../../../services/FeedbackService'
import { Contact } from '../../../types/Contact'

type Props = {
  senderAddress: Contact['publicIdentity']['address']
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
    const { requestForAttestation, onFinished, senderAddress } = this.props

    contactRepository
      .findByAddress(senderAddress)
      .then((claimer: Contact) => {
        attestationWorkflow
          .approveAndSubmitAttestationForClaim(requestForAttestation, claimer)
          .then(() => {
            notifySuccess('Claim attested and sent to claimer.')
            if (onFinished) {
              onFinished()
            }
          })
      })
      .catch(error => {
        errorService.log({
          error,
          message: 'Could not retrieve claimer',
          origin: 'AttestClaim.attestClaim()',
        })
      })
  }
}

export default AttestClaim
