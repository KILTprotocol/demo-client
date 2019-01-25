import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import Modal from '../../../components/Modal/Modal'
import SelectClaims from '../../../components/SelectClaims/SelectClaims'
import ContactRepository from '../../../services/ContactRepository'
import CtypeRepository from '../../../services/CtypeRepository'
import ErrorService from '../../../services/ErrorService'
import FeedbackService, {
  notifySuccess,
} from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import * as Claims from '../../../state/ducks/Claims'
import { Contact } from '../../../types/Contact'
import { CType } from '../../../types/Ctype'
import { MessageBodyType, SubmitClaimForCtype } from '../../../types/Message'
import { BlockUi } from '../../../types/UserFeedback'

import './ChooseClaimForCtype.scss'

type Props = {
  claimEntries: Claims.Entry[]
  ctypeKey: CType['key']
  onFinished?: () => void
  senderKey: string
}

type State = {
  ctype?: CType
  selectedClaim?: Claims.Entry
  selectedAttestations: sdk.IAttestation[]
  workflowStarted: boolean
}

class ChooseClaimForCtype extends React.Component<Props, State> {
  public chooseClaimModal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      selectedAttestations: [],
      workflowStarted: false,
    }

    this.startWorkflow = this.startWorkflow.bind(this)
    this.selectClaim = this.selectClaim.bind(this)
    this.sendClaim = this.sendClaim.bind(this)
  }

  public componentDidMount() {
    const { ctypeKey } = this.props

    CtypeRepository.findByKey(ctypeKey).then((ctype: CType) => {
      this.setState({ ctype })
    })
  }

  public render() {
    const { workflowStarted } = this.state
    return (
      <section className="ChooseClaimForCtype">
        {!workflowStarted && (
          <div className="actions">
            <button onClick={this.startWorkflow}>
              Select Claims & Attestations
            </button>
          </div>
        )}
        {workflowStarted && this.getClaimSelect()}
        {workflowStarted && this.getAttestionsSelect()}
      </section>
    )
  }

  private getClaimSelect() {
    const { claimEntries } = this.props
    const { ctype } = this.state

    if (!ctype) {
      return ''
    }

    const claims: Claims.Entry[] = claimEntries.filter(
      (claimEntry: Claims.Entry) => claimEntry.claim.ctype === ctype.key
    )
    return !!claims && !!claims.length ? (
      <div className="select-claim">
        <h4>Claim</h4>
        <SelectClaims
          claims={claims}
          onChange={this.selectClaim}
          showAttested={true}
        />
      </div>
    ) : (
      <div className="no-claim">
        <span>No claim for CTYPE '{ctype.name}' found.</span>
        <Link to={`/claim/new/${ctype.key}`}>Create Claim</Link>
      </div>
    )
  }

  private selectClaim(claims: Claims.Entry[]) {
    this.setState({
      selectedClaim: claims[0],
    })
  }

  private startWorkflow() {
    this.setState({
      workflowStarted: true,
    })
  }

  private getAttestionsSelect() {
    const { selectedAttestations, selectedClaim } = this.state
    return (
      !!selectedClaim &&
      // TODO: disable modals confirm button unless at least one attestation is
      // selected TODO: request attestation for selected claim
      (selectedClaim.attestations && selectedClaim.attestations.length ? (
        <React.Fragment>
          <div className="attestations">
            <h4>Attestations</h4>
            {selectedClaim.attestations
              .filter((attestation: sdk.IAttestation) => !attestation.revoked)
              .map((attestation: sdk.IAttestation) => (
                <label key={attestation.signature}>
                  <input
                    type="checkbox"
                    onChange={this.selectAttestation.bind(this, attestation)}
                  />
                  <span>{attestation.owner}</span>
                </label>
              ))}
          </div>
          <div className="actions">
            <button
              disabled={!selectedAttestations || !selectedAttestations.length}
              onClick={this.sendClaim}
            >
              Send Claim & Attestations
            </button>
          </div>
        </React.Fragment>
      ) : (
        <div className="no-attestations">
          <span>No attestations found.</span>
          <Link to={`/claim/${selectedClaim.claim.hash}`}>
            Request attestation
          </Link>
        </div>
      ))
    )
  }

  private selectAttestation(
    attestation: sdk.IAttestation,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const { checked } = event.target
    const { selectedAttestations } = this.state

    const attestationSelected = selectedAttestations.find(
      (selectedAttestation: sdk.IAttestation) =>
        attestation.signature === selectedAttestation.signature
    )

    if (checked && !attestationSelected) {
      this.setState({
        selectedAttestations: [...selectedAttestations, attestation],
      })
    } else if (attestationSelected) {
      this.setState({
        selectedAttestations: selectedAttestations.filter(
          (selectedAttestation: sdk.IAttestation) =>
            attestation.signature !== selectedAttestation.signature
        ),
      })
    }
  }

  private sendClaim() {
    const { onFinished, senderKey } = this.props
    const { selectedAttestations, selectedClaim } = this.state

    if (
      !selectedClaim ||
      !selectedAttestations ||
      !selectedAttestations.length
    ) {
      return
    }

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Resolving receiver (1/2)',
    })

    const request: SubmitClaimForCtype = {
      content: {
        attestations: selectedAttestations,
        claim: selectedClaim.claim,
      },
      type: MessageBodyType.SUBMIT_CLAIM_FOR_CTYPE,
    }

    ContactRepository.findByKey(senderKey)
      .then((receiver: Contact) => {
        blockUi.updateMessage('Sending claim & attestations (2/2)')
        MessageRepository.send(receiver, request)
          .then(() => {
            blockUi.remove()
            notifySuccess('Claim & attestations successfully sent.')
            if (onFinished) {
              onFinished()
            }
          })
          .catch(error => {
            blockUi.remove()
            ErrorService.log({
              error,
              message: 'Could not send claim and attestations',
              origin: 'ChooseClaimForCtype.sendClaim()',
              type: 'ERROR.FETCH.POST',
            })
          })
      })
      .catch(error => {
        blockUi.remove()
        ErrorService.log({
          error,
          message: 'Could not retrieve receiver',
          origin: 'ChooseClaimForCtype.sendClaim()',
          type: 'ERROR.FETCH.GET',
        })
      })
  }
}

const mapStateToProps = (state: { claims: Claims.ImmutableState }) => {
  return {
    claimEntries: state.claims
      .get('claims')
      .toList()
      .toArray(),
  }
}

export default connect(mapStateToProps)(ChooseClaimForCtype)
