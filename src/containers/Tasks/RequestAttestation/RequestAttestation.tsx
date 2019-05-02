import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import { ViewType } from '../../../components/DelegationNode/DelegationNode'

import MyClaimCreateView from '../../../components/MyClaimCreateView/MyClaimCreateView'
import MyClaimDetailView from '../../../components/MyClaimDetailView/MyClaimDetailView'
import SelectClaims from '../../../components/SelectClaims/SelectClaims'
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

  onCancel?: () => void
  onFinished?: () => void
}

type State = {
  savedClaimEntry?: Claims.Entry
  createNewClaim?: boolean
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
    this.onCancel = this.onCancel.bind(this)
    this.onSelectClaims = this.onSelectClaims.bind(this)
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
    const { createNewClaim, savedClaimEntry } = this.state

    return (
      <section className="RequestAttestation">
        {savedClaimEntry ? (
          <MyClaimDetailView
            claimEntry={savedClaimEntry}
            hideAttestedClaims={true}
          />
        ) : (
          this.getCreateOrUseExisting()
        )}

        {((!!legitimations && !!legitimations.length) || !!delegationId) && (
          <AttestedClaimsListView
            attestedClaims={legitimations}
            delegationId={delegationId}
            context="legitimations"
            currentDelegationViewType={ViewType.Present}
          />
        )}

        <div className="actions">
          <button onClick={this.onCancel}>Cancel</button>
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

  private getCreateOrUseExisting() {
    const { claim, legitimations, delegationId } = this.props
    const { createNewClaim, savedClaimEntry } = this.state

    const myClaims = Claims.getClaimsByCTypeHash(
      PersistentStore.store.getState(),
      claim.cType
    )

    if (!myClaims || !myClaims.length) {
      return (
        <MyClaimCreateView
          partialClaim={claim}
          onCreate={this.handleCreateClaim}
        />
      )
    }

    if (createNewClaim == null) {
      return (
        <section className="chooseAction">
          <h2>Choose action</h2>
          <div>
            <button onClick={this.setCreateNewClaim.bind(this, false)}>
              Select claim
            </button>
            <button onClick={this.setCreateNewClaim.bind(this, true)}>
              Create new claim
            </button>
          </div>
        </section>
      )
    } else if (createNewClaim) {
      return (
        <MyClaimCreateView
          partialClaim={claim}
          onCreate={this.handleCreateClaim}
        />
      )
    } else {
      return (
        <section className="selectClaim">
          <h2>Select claim</h2>
          <SelectClaims
            cTypeHash={claim.cType}
            onChange={this.onSelectClaims}
            isMulti={false}
          />
        </section>
      )
    }
  }

  private setCreateNewClaim(createNewClaim: boolean) {
    this.setState({ createNewClaim })
  }

  private onSelectClaims(selectedClaims: Claims.Entry[]) {
    this.setState({
      savedClaimEntry: selectedClaims[0],
    })
  }

  private handleCreateClaim(currentClaim: sdk.IPartialClaim) {
    this.setState({
      savedClaimEntry: Claims.getClaim(
        PersistentStore.store.getState(),
        currentClaim
      ),
    })
  }

  private onCancel() {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
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
      attestationWorkflow
        .requestAttestationForClaim(
          savedClaimEntry.claim,
          receiverAddresses,
          (legitimations || []).map((legitimation: sdk.IAttestedClaim) =>
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
  }
}

export default RequestAttestation
