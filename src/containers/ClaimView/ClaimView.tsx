import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { Redirect, RouteComponentProps, withRouter } from 'react-router'
import SelectContactsModal from '../../components/Modal/SelectContactsModal'
import MyClaimDetailView from '../../components/MyClaimDetailView/MyClaimDetailView'
import MyClaimListView from '../../components/MyClaimListView/MyClaimListView'
import attestationWorkflow from '../../services/AttestationWorkflow'
import { notifyFailure, safeDelete } from '../../services/FeedbackService'
import * as Claims from '../../state/ducks/Claims'
import * as UiState from '../../state/ducks/UiState'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'

import { IContact, IMyIdentity } from '../../types/Contact'

import './ClaimView.scss'
import { ICTypeWithMetadata } from '../../types/Ctype'
import { RequestAttestationProps } from '../Tasks/RequestAttestation/RequestAttestation'
import { RequestTermsProps } from '../Tasks/RequestTerms/RequestTerms'

type StateProps = {
  claimEntries: Claims.Entry[]
  selectedIdentity: IMyIdentity
}

type DispatchProps = {
  removeClaim: (claimId: Claims.Entry['id']) => void
}

type Props = RouteComponentProps<{ claimId: Claims.Entry['id'] }> &
  StateProps &
  DispatchProps

type State = {
  redirect?: string
}

class ClaimView extends React.Component<Props, State> {
  private static requestTerm(claimEntry: Claims.Entry): void {
    PersistentStore.store.dispatch(
      UiState.Store.updateCurrentTaskAction({
        objective: sdk.MessageBodyType.REQUEST_TERMS,
        props: {
          cTypeHash: claimEntry.claim.cTypeHash,
          preSelectedClaimEntries: [claimEntry],
        } as RequestTermsProps,
      })
    )
  }

  private static requestAttestation(claimEntry: Claims.Entry): void {
    PersistentStore.store.dispatch(
      UiState.Store.updateCurrentTaskAction({
        objective: sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
        props: {
          claim: claimEntry.claim,
        } as RequestAttestationProps,
      })
    )
  }

  private claimIdToAttest: Claims.Entry['id']
  private claimIdToLegitimate: Claims.Entry['id']

  constructor(props: Props) {
    super(props)
    this.state = {}
    this.deleteClaim = this.deleteClaim.bind(this)
    this.cancelSelectAttesters = this.cancelSelectAttesters.bind(this)
    this.finishSelectAttesters = this.finishSelectAttesters.bind(this)
    this.createClaimFromCType = this.createClaimFromCType.bind(this)
  }

  public componentDidMount(): void {
    const { match } = this.props
    const { claimId } = match.params
    if (this.isDetailView()) {
      this.getCurrentClaimEntry(claimId)
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    const { selectedIdentity } = this.props
    if (
      prevProps.selectedIdentity.identity.getAddress() !==
      selectedIdentity.identity.getAddress()
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        redirect: '/claim',
      })
    }
  }

  private getCurrentClaimEntry(
    id: Claims.Entry['id']
  ): Claims.Entry | undefined {
    const { claimEntries } = this.props

    return claimEntries.find((claimEntry: Claims.Entry) => claimEntry.id === id)
  }

  private isDetailView(): boolean {
    const { claimEntries, match } = this.props
    const { claimId } = match.params
    return !!(claimEntries && claimEntries.length && claimId)
  }

  private deleteClaim(claimEntry: Claims.Entry): void {
    const { removeClaim, history } = this.props

    safeDelete(`claim '${claimEntry.meta.alias}'`, () => {
      removeClaim(claimEntry.id)
      history.push('/claim')
    })
  }

  private cancelSelectAttesters(): void {
    delete this.claimIdToLegitimate
    delete this.claimIdToAttest
  }

  private finishSelectAttesters(selectedAttesters: IContact[]): void {
    const claim = this.resolveClaim(
      this.claimIdToLegitimate || this.claimIdToAttest
    )

    if (claim) {
      if (this.claimIdToLegitimate) {
        attestationWorkflow.requestTerms(
          [claim],
          selectedAttesters.map(
            (contact: IContact) => contact.publicIdentity.address
          )
        )
      } else if (this.claimIdToAttest) {
        attestationWorkflow.requestAttestationForClaim(
          claim,
          selectedAttesters.map(
            (contact: IContact) => contact.publicIdentity.address
          )
        )
      }
    } else {
      notifyFailure(`Could not resolve Claim`)
    }
  }

  private resolveClaim(claimId: Claims.Entry['id']): sdk.IClaim | undefined {
    const { claimEntries } = this.props

    const claimToAttest = claimEntries.find(
      (claimEntry: Claims.Entry) => claimEntry.id === claimId
    )
    if (claimToAttest) {
      const { claim } = claimToAttest
      return claim
    }
    return undefined
  }

  private createClaimFromCType(selectedCTypes: ICTypeWithMetadata[]): void {
    const { history } = this.props
    history.push(`/claim/new/${selectedCTypes[0].cType.hash}`)
  }

  public render(): JSX.Element {
    const { claimEntries, match } = this.props
    const { claimId } = match.params
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
            cancelable
            claimEntry={currentClaimEntry}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={ClaimView.requestAttestation}
            onRequestTerm={ClaimView.requestTerm}
          />
        )}
        {!isDetailView && (
          <MyClaimListView
            claimStore={claimEntries}
            onCreateClaimFromCType={this.createClaimFromCType}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={ClaimView.requestAttestation}
            onRequestTerm={ClaimView.requestTerm}
          />
        )}
        {}
        <SelectContactsModal
          placeholder="Select attester#{multi}…"
          onCancel={this.cancelSelectAttesters}
          onConfirm={this.finishSelectAttesters}
        />
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  claimEntries: Claims.getClaims(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps: DispatchProps = {
  removeClaim: (claimId: Claims.Entry['id']) =>
    Claims.Store.removeAction(claimId),
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(ClaimView))
