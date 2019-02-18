import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import attestationWorkflow from '../../../services/AttestationWorkflow'
import contactRepository from '../../../services/ContactRepository'
import errorService from '../../../services/ErrorService'
import FeedbackService, {
  notifyFailure,
  notifySuccess,
} from '../../../services/FeedbackService'
import { Contact } from '../../../types/Contact'
import { BlockUi } from '../../../types/UserFeedback'

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
    return (
      <section className="AttestClaim">
        <div className="actions">
          <button onClick={this.attestClaim}>Attest Claim</button>
        </div>
      </section>
    )
  }

  private attestClaim() {
    const { requestForAttestation, onFinished, senderAddress } = this.props

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Attesting claim',
    })

    contactRepository.findAll().then(() => {
      const claimer: Contact | undefined = contactRepository.findByAddress(
        senderAddress
      )
      if (claimer) {
        attestationWorkflow
          .approveAndSubmitAttestationForClaim(requestForAttestation, claimer)
          .then(() => {
            notifySuccess('Claim attested and sent to claimer.')
            blockUi.remove()
            if (onFinished) {
              onFinished()
            }
          })
          .catch((rejectedReceivers: Contact[]) => {
            blockUi.remove()
          })
      } else {
        blockUi.remove()
        errorService.log({
          error: new Error(),
          message: 'Could not retrieve claimer',
          origin: 'AttestClaim.attestClaim()',
        })
      }
    })
  }
}

export default AttestClaim
