import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'

import { RouteComponentProps, withRouter } from 'react-router'
import ClaimDetailView from '../../components/ClaimDetailView/ClaimDetailView'
import ClaimListView from '../../components/ClaimListView/ClaimListView'
import SelectAttestersModal from '../../components/Modal/SelectAttestersModal'
import attestationService from '../../services/AttestationService'
import attestationWorkflow from '../../services/AttestationWorkflow'
import errorService from '../../services/ErrorService'
import { notifyFailure } from '../../services/FeedbackService'
import * as Claims from '../../state/ducks/Claims'
import { State as ReduxState } from '../../state/PersistentStore'

import { Contact } from '../../types/Contact'

import './ClaimView.scss'

type Props = RouteComponentProps<{ claimId: Claims.Entry['id'] }> & {
  claimEntries: Claims.Entry[]
  removeClaim: (claimId: Claims.Entry['id']) => void
  updateAttestation: (attestation: sdk.IAttestedClaim) => void
}

type State = {
  isSelectAttestersOpen: boolean
  currentClaimEntry?: Claims.Entry | 'notFoundInList'
}

class ClaimView extends React.Component<Props, State> {
  public selectedAttesters: Contact[] = []
  private selectAttestersModal: SelectAttestersModal | null
  private claimIdToAttest: Claims.Entry['id']
  private claimIdToLegitimate: Claims.Entry['id']

  constructor(props: Props) {
    super(props)
    this.state = {
      isSelectAttestersOpen: false,
    }
    this.deleteClaim = this.deleteClaim.bind(this)
    this.onRequestLegitimation = this.onRequestLegitimation.bind(this)
    this.onRequestAttestation = this.onRequestAttestation.bind(this)

    this.cancelSelectAttesters = this.cancelSelectAttesters.bind(this)
    this.finishSelectAttesters = this.finishSelectAttesters.bind(this)

    this.onVerifyAttestation = this.onVerifyAttestation.bind(this)
  }

  public componentDidMount() {
    const { claimId } = this.props.match.params
    if (this.isDetailView()) {
      this.getCurrentClaimEntry(claimId)
    }
  }

  public componentDidUpdate() {
    const { claimId } = this.props.match.params
    if (this.isDetailView()) {
      this.getCurrentClaimEntry(claimId)
    }
  }

  public render() {
    const { claimId } = this.props.match.params
    const { claimEntries } = this.props
    const { currentClaimEntry, isSelectAttestersOpen } = this.state

    const validCurrentClaimEntry =
      claimId && currentClaimEntry && currentClaimEntry !== 'notFoundInList'

    return (
      <section className="ClaimView">
        {validCurrentClaimEntry && (
          <ClaimDetailView
            cancelable={true}
            claimEntry={currentClaimEntry as Claims.Entry}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.onRequestAttestation}
            onRequestLegitimation={this.onRequestLegitimation}
            onVerifyAttestation={this.onVerifyAttestation}
          />
        )}
        {!validCurrentClaimEntry && (
          <ClaimListView
            claimStore={claimEntries}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.onRequestAttestation}
            onRequestLegitimation={this.onRequestLegitimation}
          />
        )}
        <SelectAttestersModal
          ref={el => {
            this.selectAttestersModal = el
          }}
          onCancel={this.cancelSelectAttesters}
          onConfirm={this.finishSelectAttesters}
        />
      </section>
    )
  }

  private isDetailView() {
    const { claimEntries } = this.props
    const { claimId } = this.props.match.params
    const { currentClaimEntry } = this.state
    return claimEntries && claimEntries.length && !currentClaimEntry && claimId
  }

  private getCurrentClaimEntry(hash: string) {
    const { claimEntries } = this.props

    const currentClaimEntry = claimEntries.find(
      (claimEntry: Claims.Entry) => claimEntry.id === hash
    )

    if (!currentClaimEntry) {
      const message = `Could not get claim with hash '${hash}' from local list of claims`
      this.setState({ currentClaimEntry: 'notFoundInList' }, () => {
        errorService.log({
          error: { name: 'Error while setting current claim', message },
          message,
          origin: 'ClaimView.getCurrentClaimEntry()',
        })
      })
    } else {
      this.setState({ currentClaimEntry })
    }
  }

  private deleteClaim(claimId: Claims.Entry['id']) {
    const { removeClaim } = this.props
    removeClaim(claimId)
    this.props.history.push('/claim')
  }

  private async onVerifyAttestation(
    attestedClaim: sdk.IAttestedClaim
  ): Promise<boolean> {
    const { updateAttestation } = this.props
    const { currentClaimEntry } = this.state
    return attestationService
      .verifyAttestatedClaim(attestedClaim)
      .then((verified: boolean) => {
        if (currentClaimEntry && currentClaimEntry !== 'notFoundInList') {
          updateAttestation(
            Object.assign(attestedClaim, { revoked: !verified })
          )
        }
        return verified
      })
  }

  private onRequestLegitimation(claimId: Claims.Entry['id']) {
    if (this.selectAttestersModal) {
      this.claimIdToLegitimate = claimId
      delete this.claimIdToAttest
      this.selectAttestersModal.show()
    }
  }

  private onRequestAttestation(claimId: Claims.Entry['id']) {
    if (this.selectAttestersModal) {
      delete this.claimIdToLegitimate
      this.claimIdToAttest = claimId
      this.selectAttestersModal.show()
    }
  }

  private cancelSelectAttesters() {
    this.selectedAttesters = []
    delete this.claimIdToLegitimate
    delete this.claimIdToAttest
  }

  private finishSelectAttesters(selectedAttesters: Contact[]) {
    const claim = this.resolveClaim(
      this.claimIdToLegitimate || this.claimIdToAttest
    )

    if (claim) {
      if (this.claimIdToLegitimate) {
        attestationWorkflow.requestLegitimations(claim, selectedAttesters)
      } else if (this.claimIdToAttest) {
        attestationWorkflow.requestAttestationForClaim(
          claim,
          this.selectedAttesters
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
      return claim
    } else {
      return undefined
    }
  }
}

export function getClaimActions(
  action: 'delete' | 'requestAttestation' | 'requestLegitimation',
  callback: () => void
) {
  switch (action) {
    case 'requestAttestation': {
      return (
        <button
          className="requestAttestation"
          onClick={callback}
          title="Request attestation of this claim from attester"
        >
          Get Attestation
        </button>
      )
    }
    case 'requestLegitimation': {
      return (
        <button
          className="requestLegitimation"
          onClick={callback}
          title="Request legimation for attestation of this claim from attester"
        >
          Get Legitimation
        </button>
      )
    }
    case 'delete': {
      return <button className="deleteClaim" onClick={callback} />
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  claimEntries: Claims.getClaims(state),
})

const mapDispatchToProps = (dispatch: (action: Claims.Action) => void) => {
  return {
    removeClaim: (claimId: Claims.Entry['id']) => {
      dispatch(Claims.Store.removeAction(claimId))
    },
    updateAttestation: (attestation: sdk.IAttestedClaim) => {
      dispatch(Claims.Store.updateAttestation(attestation))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(ClaimView))
