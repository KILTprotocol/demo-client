import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect } from 'react-redux'

import { Redirect, RouteComponentProps, withRouter } from 'react-router'
import SelectContactsModal from '../../components/Modal/SelectContactsModal'
import MyClaimDetailView from '../../components/MyClaimDetailView/MyClaimDetailView'
import MyClaimListView from '../../components/MyClaimListView/MyClaimListView'
import attestationWorkflow from '../../services/AttestationWorkflow'
import { notifyFailure, safeDelete } from '../../services/FeedbackService'
import * as Claims from '../../state/ducks/Claims'
import * as UiState from '../../state/ducks/UiState'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore from '../../state/PersistentStore'
import { State as ReduxState } from '../../state/PersistentStore'

import { Contact, MyIdentity } from '../../types/Contact'

import './ClaimView.scss'
import { ICTypeWithMetadata } from '../../types/Ctype'
import { RequestAttestationProps } from '../Tasks/RequestAttestation/RequestAttestation'
import { RequestLegitimationsProps } from '../Tasks/RequestLegitimation/RequestLegitimation'

type Props = RouteComponentProps<{ claimId: Claims.Entry['id'] }> & {
  removeClaim: (claimId: Claims.Entry['id']) => void

  // redux
  claimEntries: Claims.Entry[]
  selectedIdentity: MyIdentity
}

type State = {
  isSelectAttestersOpen: boolean
  redirect?: string
}

class ClaimView extends React.Component<Props, State> {
  private selectAttestersModal: SelectContactsModal | null
  private claimIdToAttest: Claims.Entry['id']
  private claimIdToLegitimate: Claims.Entry['id']

  constructor(props: Props) {
    super(props)
    this.state = {
      isSelectAttestersOpen: false,
    }
    this.deleteClaim = this.deleteClaim.bind(this)
    this.requestLegitimation = this.requestLegitimation.bind(this)
    this.requestAttestation = this.requestAttestation.bind(this)

    this.cancelSelectAttesters = this.cancelSelectAttesters.bind(this)
    this.finishSelectAttesters = this.finishSelectAttesters.bind(this)

    this.createClaimFromCType = this.createClaimFromCType.bind(this)
  }

  public componentDidMount() {
    const { claimId } = this.props.match.params
    if (this.isDetailView()) {
      this.getCurrentClaimEntry(claimId)
    }
  }

  public componentDidUpdate(prevProps: Props) {
    if (
      prevProps.selectedIdentity.identity.address !==
      this.props.selectedIdentity.identity.address
    ) {
      this.setState({
        redirect: '/claim',
      })
    }
  }

  public render() {
    const { claimEntries } = this.props
    const { claimId } = this.props.match.params
    const { redirect } = this.state

    const isDetailView = this.isDetailView()

    let currentClaimEntry
    if (isDetailView) {
      currentClaimEntry = this.getCurrentClaimEntry(claimId)
    }

    if (redirect) {
      return <Redirect to={redirect} />
    }

    return (
      <section className="ClaimView">
        {isDetailView && currentClaimEntry && (
          <MyClaimDetailView
            cancelable={true}
            claimEntry={currentClaimEntry as Claims.Entry}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.requestAttestation}
            onRequestLegitimation={this.requestLegitimation}
          />
        )}
        {!isDetailView && (
          <MyClaimListView
            claimStore={claimEntries}
            onCreateClaimFromCType={this.createClaimFromCType}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.requestAttestation}
            onRequestLegitimation={this.requestLegitimation}
          />
        )}
        {}
        <SelectContactsModal
          ref={el => {
            this.selectAttestersModal = el
          }}
          placeholder="Select attester#{multi}…"
          onCancel={this.cancelSelectAttesters}
          onConfirm={this.finishSelectAttesters}
        />
      </section>
    )
  }

  private isDetailView() {
    const { claimEntries } = this.props
    const { claimId } = this.props.match.params
    return !!(claimEntries && claimEntries.length && claimId)
  }

  private getCurrentClaimEntry(id: Claims.Entry['id']) {
    const { claimEntries } = this.props

    return claimEntries.find((claimEntry: Claims.Entry) => claimEntry.id === id)
  }

  private deleteClaim(claimEntry: Claims.Entry) {
    const { removeClaim } = this.props

    safeDelete(`claim '${claimEntry.meta.alias}'`, () => {
      removeClaim(claimEntry.id)
      this.props.history.push('/claim')
    })
  }

  private requestLegitimation(claimEntry: Claims.Entry) {
    PersistentStore.store.dispatch(
      UiState.Store.updateCurrentTaskAction({
        objective: sdk.MessageBodyType.REQUEST_TERMS,
        props: {
          cTypeHash: claimEntry.claim.cTypeHash,
          preSelectedClaimEntries: [claimEntry],
        } as RequestLegitimationsProps,
      })
    )
  }

  private requestAttestation(claimEntry: Claims.Entry) {
    PersistentStore.store.dispatch(
      UiState.Store.updateCurrentTaskAction({
        objective: sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
        props: {
          claim: claimEntry.claim,
        } as RequestAttestationProps,
      })
    )
  }

  private cancelSelectAttesters() {
    delete this.claimIdToLegitimate
    delete this.claimIdToAttest
  }

  private finishSelectAttesters(selectedAttesters: Contact[]) {
    const claim = this.resolveClaim(
      this.claimIdToLegitimate || this.claimIdToAttest
    )

    if (claim) {
      if (this.claimIdToLegitimate) {
        attestationWorkflow.requestLegitimations(
          [claim],
          selectedAttesters.map(
            (contact: Contact) => contact.publicIdentity.address
          )
        )
      } else if (this.claimIdToAttest) {
        attestationWorkflow.requestAttestationForClaim(
          claim,
          selectedAttesters.map(
            (contact: Contact) => contact.publicIdentity.address
          )
        )
      }
    } else {
      notifyFailure(`Could not resolve Claim`)
    }
  }

  private resolveClaim(claimId: Claims.Entry['id']): sdk.Claim | undefined {
    const { claimEntries } = this.props

    const claimToAttest = claimEntries.find(
      (claimEntry: Claims.Entry) => claimEntry.id === claimId
    )
    if (claimToAttest) {
      const { claim } = claimToAttest
      return new sdk.Claim(claim)
    } else {
      return undefined
    }
  }

  private createClaimFromCType(selectedCTypes: ICTypeWithMetadata[]) {
    this.props.history.push(`/claim/new/${selectedCTypes[0].cType.hash}`)
  }
}

const mapStateToProps = (state: ReduxState) => ({
  claimEntries: Claims.getClaims(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps = (dispatch: (action: Claims.Action) => void) => {
  return {
    removeClaim: (claimId: Claims.Entry['id']) => {
      dispatch(Claims.Store.removeAction(claimId))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(ClaimView))
