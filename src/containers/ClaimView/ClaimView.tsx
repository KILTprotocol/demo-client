import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'

import { RouteComponentProps, withRouter } from 'react-router'
import ClaimDetailView from '../../components/ClaimDetailView/ClaimDetailView'
import ClaimListView from '../../components/ClaimListView/ClaimListView'
import Modal, { ModalType } from '../../components/Modal/Modal'
import SelectAttesters from '../../components/SelectAttesters/SelectAttesters'
import attestationService from '../../services/AttestationService'
import attestationWorkflow from '../../services/AttestationWorkflow'
import errorService from '../../services/ErrorService'
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
  private selectAttestersModal: Modal | null
  private claimIdToAttest: Claims.Entry['id']

  constructor(props: Props) {
    super(props)
    this.state = {
      isSelectAttestersOpen: false,
    }
    this.deleteClaim = this.deleteClaim.bind(this)
    this.showAttesterSelectionModal = this.showAttesterSelectionModal.bind(this)
    this.hideAttersterSelectionModal = this.hideAttersterSelectionModal.bind(
      this
    )
    this.requestAttestationForClaim = this.requestAttestationForClaim.bind(this)
    this.onSelectAttesters = this.onSelectAttesters.bind(this)
    this.setSelectAttestersOpen = this.setSelectAttestersOpen.bind(this)
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

    console.log('claimId', claimId)
    console.log('claimEntries', claimEntries)
    console.log('validCurrentClaimEntry', validCurrentClaimEntry)
    return (
      <section className="ClaimView">
        {validCurrentClaimEntry && (
          <ClaimDetailView
            cancelable={true}
            claimEntry={currentClaimEntry as Claims.Entry}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.showAttesterSelectionModal}
            onVerifyAttestation={this.onVerifyAttestation}
          />
        )}
        {!validCurrentClaimEntry && (
          <ClaimListView
            claimStore={claimEntries}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.showAttesterSelectionModal}
          />
        )}
        <Modal
          ref={el => {
            this.selectAttestersModal = el
          }}
          type={ModalType.CONFIRM}
          header="Select Attester(s):"
          onCancel={this.hideAttersterSelectionModal}
          onConfirm={this.requestAttestationForClaim}
          catchBackdropClick={isSelectAttestersOpen}
        >
          {this.getSelectAttesters()}
        </Modal>
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

  private getSelectAttesters() {
    return (
      <div>
        <SelectAttesters
          onChange={this.onSelectAttesters}
          onMenuOpen={this.setSelectAttestersOpen(true)}
          onMenuClose={this.setSelectAttestersOpen(false, 500)}
        />
      </div>
    )
  }

  private onSelectAttesters(selectedAttesters: Contact[]) {
    this.selectedAttesters = selectedAttesters
  }

  private setSelectAttestersOpen = (
    isSelectAttestersOpen: boolean,
    delay = 0
  ) => () => {
    setTimeout(() => {
      this.setState({ isSelectAttestersOpen })
    }, delay)
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

  private showAttesterSelectionModal(claimId: Claims.Entry['id']) {
    this.claimIdToAttest = claimId
    if (this.selectAttestersModal) {
      this.selectAttestersModal.show()
    }
  }

  private hideAttersterSelectionModal() {
    this.selectedAttesters = []
  }

  private requestAttestationForClaim() {
    const { claimEntries } = this.props

    const claimToAttest = claimEntries.find(
      (claimEntry: Claims.Entry) => claimEntry.id === this.claimIdToAttest
    )
    if (claimToAttest) {
      const { claim } = claimToAttest
      attestationWorkflow.requestAttestationForClaim(
        claim,
        this.selectedAttesters
      )
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
