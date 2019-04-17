import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import { ViewType } from '../../../components/DelegationNode/DelegationNode'

import MyClaimCreateView from '../../../components/MyClaimCreateView/MyClaimCreateView'
import MyClaimDetailView from '../../../components/MyClaimDetailView/MyClaimDetailView'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import ContactRepository from '../../../services/ContactRepository'
import * as Claims from '../../../state/ducks/Claims'
import PersistentStore from '../../../state/PersistentStore'
import { Contact } from '../../../types/Contact'

import './RequestAttestation.scss'

export type RequestAttestationProps = {
  claim: sdk.IPartialClaim
  legitimations: sdk.IAttestedClaim[]
  receiverAddresses: Array<sdk.PublicIdentity['address']>

  delegationId?: sdk.IDelegationNode['id']

  onFinished?: () => void
}

type State = {
  savedClaimEntry?: Claims.Entry
}

class RequestAttestation extends React.Component<
  RequestAttestationProps,
  State
> {
  constructor(props: RequestAttestationProps) {
    super(props)
    this.state = {}
    this.handleCreateClaim = this.handleCreateClaim.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  public componentDidMount() {
    const { claim } = this.props
    // check if we already have the messages claim stored
    this.setState({
      savedClaimEntry: Claims.getClaim(PersistentStore.store.getState(), claim),
    })
  }

  public render() {
    const { claim, legitimations, delegationId } = this.props
    const { savedClaimEntry } = this.state

    return (
      <section className="RequestAttestation">
        {savedClaimEntry ? (
          <MyClaimDetailView
            claimEntry={savedClaimEntry}
            hideAttestedClaims={true}
          />
        ) : (
          <MyClaimCreateView
            partialClaim={claim}
            onCreate={this.handleCreateClaim}
          />
        )}

        <AttestedClaimsListView
          attestedClaims={legitimations}
          delegationId={delegationId}
          context="legitimations"
          currentDelegationViewType={ViewType.Present}
        />

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
    const {
      receiverAddresses,
      legitimations,
      delegationId,
      onFinished,
    } = this.props
    const { savedClaimEntry } = this.state

    if (savedClaimEntry) {
      ContactRepository.findByAddress(receiverAddresses[0]).then(
        (attester: Contact) => {
          attestationWorkflow
            .requestAttestationForClaim(
              savedClaimEntry.claim,
              [attester],
              legitimations.map((legitimation: sdk.IAttestedClaim) =>
                sdk.AttestedClaim.fromObject(legitimation)
              ),
              delegationId
            )
            .then(() => {
              if (onFinished) {
                onFinished()
              }
            })
        }
      )
    }
  }
}

export default RequestAttestation
