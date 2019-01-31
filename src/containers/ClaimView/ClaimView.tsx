import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import CtypeRepository from 'src/services/CtypeRepository'
import ErrorService from 'src/services/ErrorService'
import { CType } from 'src/types/Ctype'

import ClaimDetailView from '../../components/ClaimDetailView/ClaimDetailView'
import ClaimListView from '../../components/ClaimListView/ClaimListView'
import Modal, { ModalType } from '../../components/Modal/Modal'
import SelectAttesters from '../../components/SelectAttesters/SelectAttesters'
import attestationService from '../../services/AttestationService'
import { notifySuccess } from '../../services/FeedbackService'
import MessageRepository from '../../services/MessageRepository'
import * as Claims from '../../state/ducks/Claims'
import { Contact } from '../../types/Contact'
import { ClaimMessageBodyContent, MessageBodyType } from '../../types/Message'

import './ClaimView.scss'

type Props = RouteComponentProps<{ hash: string }> & {
  claimEntries: Claims.Entry[]
  removeClaim: (hash: sdk.IClaim['hash']) => void
  updateAttestation: (
    hash: sdk.IClaim['hash'],
    attestation: sdk.Attestation
  ) => void
}

type State = {
  isSelectAttestersOpen: boolean
  currentClaimEntry?: Claims.Entry | 'notFoundInList'
}

class ClaimView extends React.Component<Props, State> {
  public selectedAttesters: Contact[] = []
  private selectAttestersModal: Modal | null
  private claimHashToAttest: string

  constructor(props: Props) {
    super(props)
    this.state = {
      isSelectAttestersOpen: false,
    }
    this.deleteClaim = this.deleteClaim.bind(this)
    this.onRequestAttestation = this.onRequestAttestation.bind(this)
    this.onCancelRequestAttestation = this.onCancelRequestAttestation.bind(this)
    this.onFinishRequestAttestation = this.onFinishRequestAttestation.bind(this)
    this.onSelectAttesters = this.onSelectAttesters.bind(this)
    this.setSelectAttestersOpen = this.setSelectAttestersOpen.bind(this)
    this.onVerifyAttestation = this.onVerifyAttestation.bind(this)
  }

  public componentDidMount() {
    const { hash } = this.props.match.params
    if (this.isDetailView()) {
      this.getCurrentClaimEntry(hash)
    }
  }

  public componentDidUpdate() {
    const { hash } = this.props.match.params
    if (this.isDetailView()) {
      this.getCurrentClaimEntry(hash)
    }
  }

  public render() {
    const { hash } = this.props.match.params
    const { claimEntries } = this.props
    const { currentClaimEntry, isSelectAttestersOpen } = this.state

    const validCurrentClaimEntry =
      hash && currentClaimEntry && currentClaimEntry !== 'notFoundInList'
    return (
      <section className="ClaimView">
        {validCurrentClaimEntry && (
          <ClaimDetailView
            cancelable={true}
            claimEntry={currentClaimEntry as Claims.Entry}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.onRequestAttestation}
            onVerifyAttestation={this.onVerifyAttestation}
          />
        )}
        {!validCurrentClaimEntry && (
          <ClaimListView
            claimStore={claimEntries}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.onRequestAttestation}
          />
        )}
        <Modal
          ref={el => {
            this.selectAttestersModal = el
          }}
          type={ModalType.CONFIRM}
          header="Select Attester(s):"
          onCancel={this.onCancelRequestAttestation}
          onConfirm={this.onFinishRequestAttestation}
          catchBackdropClick={isSelectAttestersOpen}
        >
          {this.getSelectAttesters()}
        </Modal>
      </section>
    )
  }

  private isDetailView() {
    const { claimEntries } = this.props
    const { hash } = this.props.match.params
    const { currentClaimEntry } = this.state
    return claimEntries && claimEntries.length && !currentClaimEntry && hash
  }

  private getCurrentClaimEntry(hash: string) {
    const { claimEntries } = this.props

    const currentClaimEntry = claimEntries.find(
      (claimEntry: Claims.Entry) => claimEntry.claim.hash === hash
    )

    if (!currentClaimEntry) {
      const message = `Could not get claim with hash '${hash}' from local list of claims`
      this.setState({ currentClaimEntry: 'notFoundInList' }, () => {
        ErrorService.log({
          error: { name: 'Error while setting current claim', message },
          message,
          origin: 'ClaimView.getCurrentClaimEntry()',
        })
      })
    } else {
      this.setState({ currentClaimEntry })
    }
  }

  private deleteClaim(hash: string) {
    const { removeClaim } = this.props
    removeClaim(hash)
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
    attestation: sdk.Attestation
  ): Promise<boolean> {
    const { updateAttestation } = this.props
    const { currentClaimEntry } = this.state
    return attestationService
      .verifyAttestation(attestation)
      .then((verified: boolean) => {
        if (
          currentClaimEntry &&
          currentClaimEntry !== 'notFoundInList' &&
          attestation.revoked === verified
        ) {
          updateAttestation(
            currentClaimEntry.claim.hash,
            Object.assign(attestation, { revoked: !verified })
          )
        }
        return verified
      })
  }

  private onRequestAttestation(hash: string) {
    this.claimHashToAttest = hash
    if (this.selectAttestersModal) {
      this.selectAttestersModal.show()
    }
  }

  private onCancelRequestAttestation() {
    this.selectedAttesters = []
  }

  private onFinishRequestAttestation() {
    const { claimEntries } = this.props

    const claimToAttest = claimEntries.find(
      (claimEntry: Claims.Entry) =>
        claimEntry.claim.hash === this.claimHashToAttest
    )

    if (claimToAttest) {
      const { claim } = claimToAttest
      CtypeRepository.findByKey(claim.ctype)
        .then((ctypeFromRepository: CType) => {
          const content = {
            cType: {
              name: ctypeFromRepository.name,
            },
            claim,
          } as ClaimMessageBodyContent
          this.selectedAttesters.forEach((attester: Contact) => {
            MessageRepository.send(attester, {
              content,
              type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
            })
              .then(() => {
                notifySuccess('Request for attestation successfully sent.')
              })
              .catch(error => {
                ErrorService.log({
                  error,
                  message: `Could not send message ${
                    MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM
                  } to ${attester.metaData.name}`,
                  origin: 'ClaimView.componentDidMount()',
                  type: 'ERROR.FETCH.GET',
                })
              })
          })
        })
        .catch(error => {
          ErrorService.log({
            error,
            message: 'Error fetching CTYPE',
            origin: 'MessageView.onFinishRequestAttestation()',
            type: 'ERROR.FETCH.GET',
          })
        })
    }
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

const mapDispatchToProps = (dispatch: (action: Claims.Action) => void) => {
  return {
    removeClaim: (hash: sdk.IClaim['hash']) => {
      dispatch(Claims.Store.removeAction(hash))
    },
    updateAttestation: (
      hash: sdk.IClaim['hash'],
      attestation: sdk.Attestation
    ) => {
      dispatch(Claims.Store.updateAttestation(hash, attestation))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(ClaimView))
