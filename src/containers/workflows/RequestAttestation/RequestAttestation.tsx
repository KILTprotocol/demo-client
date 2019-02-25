import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import ClaimCreateView from '../../../components/ClaimCreateView/ClaimCreateView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import ContactRepository from '../../../services/ContactRepository'
import ErrorService from '../../../services/ErrorService'
import * as Claims from '../../../state/ducks/Claims'
import PersistentStore from '../../../state/PersistentStore'
import { Contact } from '../../../types/Contact'
import VerifyClaim from '../VerifyClaim/VerifyClaim'

import './RequestAttestation.scss'

type Props = {
  initialClaim: sdk.IPartialClaim
  legitimations: sdk.IAttestedClaim[]
  attesterAddress: sdk.PublicIdentity['address']
  onFinished: () => void
}

type State = {
  savedClaimEntry?: Claims.Entry
}

class RequestAttestation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.handleCreateClaim = this.handleCreateClaim.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  public componentDidMount() {
    const { initialClaim } = this.props
    // check if we already have the messages claim stored
    this.setState({
      savedClaimEntry: Claims.getClaim(
        PersistentStore.store.getState(),
        initialClaim
      ),
    })
  }

  public render() {
    const { initialClaim, legitimations } = this.props
    const { savedClaimEntry } = this.state

    return (
      <section className="RequestAttestation">
        {savedClaimEntry ? (
          <ClaimDetailView
            claimEntry={savedClaimEntry}
            hideAttestedClaims={true}
          />
        ) : (
          <ClaimCreateView
            partialClaim={initialClaim}
            onCreate={this.handleCreateClaim}
          />
        )}

        <VerifyClaim attestedClaims={legitimations} context="legitimation" />
        <div className="actions">
          <button
            className="request-attestation"
            disabled={!savedClaimEntry}
            onClick={this.handleSubmit}
          >
            Request Attestation
          </button>
        </div>
      </section>
    )
  }

  private handleCreateClaim(currentClaim: sdk.IPartialClaim) {
    this.setState({
      savedClaimEntry: Claims.getClaim(
        PersistentStore.store.getState(),
        currentClaim
      ),
    })
  }

  private handleSubmit() {
    const { attesterAddress, onFinished } = this.props
    const { savedClaimEntry } = this.state

    let attester: Contact | undefined

    if (savedClaimEntry) {
      ContactRepository.findAll().then(() => {
        attester = ContactRepository.findByAddress(attesterAddress)
        if (attester) {
          attestationWorkflow
            .requestAttestationForClaim(savedClaimEntry.claim, [attester])
            .then(() => {
              onFinished()
            })
        } else {
          ErrorService.log({
            error: new Error(),
            message: `Could not resolve attester with address '${attesterAddress}'`,
            origin: 'RequestAttestation.handleSubmit()',
          })
        }
      })
    }
  }
}

export default RequestAttestation
