import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import attestationService from '../../../services/AttestationService'
import ContactRepository from '../../../services/ContactRepository'
import ErrorService from '../../../services/ErrorService'
import FeedbackService, {
  notifySuccess,
} from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import * as Attestations from '../../../state/ducks/Attestations'
import { Contact } from '../../../types/Contact'
import {
  ApproveAttestationForClaim,
  Message,
  MessageBodyType,
} from '../../../types/Message'
import { BlockUi } from '../../../types/UserFeedback'

type Props = {
  senderKey: sdk.Identity['signPublicKeyAsHex']
  claim: sdk.IClaim
  onFinished?: () => void
  ctypeName: string
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
    const { ctypeName, claim, onFinished, senderKey } = this.props

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Attesting',
      message: 'fetching contacts',
    })

    ContactRepository.findByKey(senderKey)
      .then((claimer: Contact) => {
        blockUi.updateMessage('Attesting')
        attestationService
          .attestClaim(claim)
          .then((attestation: sdk.IAttestation) => {
            attestationService.saveInStore({
              attestation,
              claimerAddress: claim.owner,
              claimerAlias: claimer.name,
              ctypeHash: claim.ctype,
              ctypeName,
            } as Attestations.Entry)

            this.sendClaimAttestedMessage(attestation, claimer, claim)
              .then(() => {
                blockUi.remove()
                notifySuccess('Attestation message successfully sent.')
                if (onFinished) {
                  onFinished()
                }
              })
              .catch(error => {
                blockUi.remove()
                ErrorService.log({
                  error,
                  message: 'Could not send attestation message',
                  origin: 'AttestClaim.sendClaimAttestedMessage()',
                  type: 'ERROR.FETCH.POST',
                })
                if (onFinished) {
                  onFinished()
                }
              })
          })
          .catch(error => {
            blockUi.remove()
            ErrorService.log({
              error,
              message: `Could not send attestation for claim ${claim.hash} to ${
                claimer.name
              }`,
              origin: 'AttestClaim.attestClaim()',
              type: 'ERROR.FETCH.POST',
            })
          })
      })
      .catch(error => {
        blockUi.remove()
        ErrorService.log({
          error,
          message: 'Could not retrieve claimer',
          origin: 'MessageView.attestCurrentClaim()',
          type: 'ERROR.FETCH.GET',
        })
      })
  }

  private sendClaimAttestedMessage(
    attestation: sdk.IAttestation,
    claimer: Contact,
    claim: sdk.IClaim
  ): Promise<Message> {
    const attestationMessageBody: ApproveAttestationForClaim = {
      content: {
        attestation,
        claim,
      },
      type: MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM,
    }
    return MessageRepository.send(claimer, attestationMessageBody)
  }
}

export default AttestClaim
