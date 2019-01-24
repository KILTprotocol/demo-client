import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import attestationService from '../../../services/AttestationService'
import ContactRepository from '../../../services/ContactRepository'
import ErrorService from '../../../services/ErrorService'
import FeedbackService, {
  notifySuccess,
} from '../../../services/FeedbackService'
import { Contact } from '../../../types/Contact'
import { BlockUi } from '../../../types/UserFeedback'

type Props = {
  senderKey: sdk.Identity['signPublicKeyAsHex']
  claim: sdk.IClaim
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
    const { onFinished, claim, senderKey } = this.props

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Fetching Contacts',
    })

    ContactRepository.findByKey(senderKey)
      .then((claimer: Contact) => {
        blockUi.updateMessage('Attesting')
        attestationService
          .attestClaim(claim, claimer)
          .then(() => {
            if (onFinished) {
              onFinished()
            }
            blockUi.remove()
            notifySuccess('Attestation successfully sent.')
          })
          .catch(error => {
            blockUi.remove()
            ErrorService.log({
              error,
              message: `Could not send attestation for claim ${claim.hash} to ${
                claimer.name
              }`,
              origin: 'MessageView.attestCurrentClaim()',
              type: 'ERROR.FETCH.POST',
            })
          })
      })
      .catch(error => {
        ErrorService.log({
          error,
          message: 'Could not retrieve claimer',
          origin: 'MessageView.attestCurrentClaim()',
          type: 'ERROR.FETCH.GET',
        })
      })
  }
}

export default AttestClaim
