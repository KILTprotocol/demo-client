import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import Modal from '../../../components/Modal/Modal'
import SelectClaims from '../../../components/SelectClaims/SelectClaims'
import contactRepository from '../../../services/ContactRepository'
import CtypeRepository from '../../../services/CtypeRepository'
import errorService from '../../../services/ErrorService'
import FeedbackService, {
  notifySuccess,
} from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import * as Claims from '../../../state/ducks/Claims'
import { State as ReduxState } from '../../../state/PersistentStore'
import { Contact } from '../../../types/Contact'
import { CType } from '../../../types/Ctype'
import { MessageBodyType, SubmitClaimForCtype } from '../../../types/Message'
import { BlockUi } from '../../../types/UserFeedback'

import './ChooseClaimForCtype.scss'

type Props = {
  claimEntries: Claims.Entry[]
  ctypeKey: CType['key']
  onFinished?: () => void
  senderAddress: Contact['publicIdentity']['address']
}

type State = {
  ctype?: CType
  selectedClaim?: Claims.Entry
  selectedAttestedClaims: sdk.IAttestedClaim[]
  workflowStarted: boolean
}

class ChooseClaimForCtype extends React.Component<Props, State> {
  public chooseClaimModal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      selectedAttestedClaims: [],
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
    const {
      selectedAttestedClaims: selectedAttestations,
      selectedClaim,
    } = this.state

    if (!selectedClaim) {
      return ''
    }

    const approvedAttestatedClaims =
      selectedClaim &&
      selectedClaim.attestations &&
      selectedClaim.attestations.length &&
      selectedClaim.attestations.filter(
        (attestedClaim: sdk.IAttestedClaim) =>
          !attestedClaim.attestation.revoked
      )
    // TODO: should we check the attestations against chain here?

    return approvedAttestatedClaims && approvedAttestatedClaims.length ? (
      <React.Fragment>
        <div className="attestations">
          <h4>Attestations</h4>
          {approvedAttestatedClaims.map((attestedClaim: sdk.IAttestedClaim) => (
            <label key={attestedClaim.attestation.signature}>
              <input
                type="checkbox"
                onChange={this.selectAttestation.bind(this, attestedClaim)}
              />
              <span>{attestedClaim.attestation.owner}</span>
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
        <Link to={`/claim/${selectedClaim.id}`}>Request attestation</Link>
      </div>
    )
  }

  private selectAttestation(
    attestedClaim: sdk.IAttestedClaim,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const { checked } = event.target
    const { selectedAttestedClaims: selectedAttestedClaims } = this.state

    const attestationSelected = selectedAttestedClaims.find(
      (selectedAttestedClaim: sdk.IAttestedClaim) =>
        attestedClaim.attestation.signature ===
        selectedAttestedClaim.attestation.signature
    )

    if (checked && !attestationSelected) {
      this.setState({
        selectedAttestedClaims: [...selectedAttestedClaims, attestedClaim],
      })
    } else if (attestationSelected) {
      this.setState({
        selectedAttestedClaims: selectedAttestedClaims.filter(
          (selectedAttestedClaim: sdk.IAttestedClaim) =>
            attestedClaim.attestation.signature !==
            selectedAttestedClaim.attestation.signature
        ),
      })
    }
  }

  private sendClaim() {
    const { onFinished, senderAddress } = this.props
    const {
      selectedAttestedClaims: selectedAttestations,
      selectedClaim,
    } = this.state

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
      content: selectedAttestations,
      type: MessageBodyType.SUBMIT_CLAIM_FOR_CTYPE,
    }

    contactRepository.findAll().then(() => {
      const receiver: Contact | undefined = contactRepository.findByAddress(
        senderAddress
      )
      if (receiver) {
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
            errorService.log({
              error,
              message: 'Could not send claim and attestations',
              origin: 'ChooseClaimForCtype.sendClaim()',
              type: 'ERROR.FETCH.POST',
            })
          })
      } else {
        blockUi.remove()
        errorService.log({
          error: new Error(),
          message: 'Could not retrieve receiver',
          origin: 'ChooseClaimForCtype.sendClaim()',
        })
      }
    })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  claimEntries: Claims.getClaims(state),
})

export default connect(mapStateToProps)(ChooseClaimForCtype)
