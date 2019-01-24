import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'

import ClaimDetailView from '../../components/ClaimDetailView/ClaimDetailView'
import ClaimListView from '../../components/ClaimListView/ClaimListView'
import Modal, { ModalType } from '../../components/Modal/Modal'
import SelectAttesters from '../../components/SelectAttesters/SelectAttesters'
import attestationService from '../../services/AttestationService'
import ErrorService from '../../services/ErrorService'
import ContactRepository from '../../services/ContactRepository'
import { notifySuccess } from '../../services/FeedbackService'
import MessageRepository from '../../services/MessageRepository'
import * as Claims from '../../state/ducks/Claims'
import { Contact } from '../../types/Contact'
import {
  MessageBodyType,
  RequestAttestationForClaim,
} from '../../types/Message'
import { MessageBodyType, ClaimMessageBody } from '../../types/Message'
import attestationService from '../../services/AttestationService'

import './ClaimView.scss'
import CtypeRepository from 'src/services/CtypeRepository'
import { CType } from 'src/types/Ctype'
import ErrorService from 'src/services/ErrorService'

type Props = RouteComponentProps<{ hash: string }> & {
  claimEntries: Claims.Entry[]
  removeClaim: (hash: string) => void
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
  }

  public componentDidUpdate() {
    const { claimEntries } = this.props
    const { hash } = this.props.match.params
    const { currentClaimEntry } = this.state
    if (claimEntries && claimEntries.length && !currentClaimEntry && hash) {
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
          header="Select Attestant(s):"
          onCancel={this.onCancelRequestAttestation}
          onConfirm={this.onFinishRequestAttestation}
          catchBackdropClick={isSelectAttestersOpen}
        >
          {this.getSelectAttestants()}
        </Modal>
      </section>
    )
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

  private getSelectAttestants() {
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
    attestation: sdk.IAttestation
  ): Promise<boolean> {
    return attestationService.verifyAttestation(attestation)
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
          } as ClaimMessageBody
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
                  message: `Could not send message ${MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM} to ${
                    attester.name
                    }`,
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
    removeClaim: (hash: string) => {
      dispatch(Claims.Store.removeAction(hash))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(ClaimView))
