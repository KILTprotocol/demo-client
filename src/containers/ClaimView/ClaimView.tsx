import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'
import * as sdk from '@kiltprotocol/prototype-sdk'

import ClaimDetailView from '../../components/ClaimDetailView/ClaimDetailView'
import ClaimListView from '../../components/ClaimListView/ClaimListView'
import Modal, { ModalType } from '../../components/Modal/Modal'
import ContactRepository from '../../services/ContactRepository'
import ErrorService from '../../services/ErrorService'
import { notifySuccess } from '../../services/FeedbackService'
import MessageRepository from '../../services/MessageRepository'
import * as Claims from '../../state/ducks/Claims'
import { Contact } from '../../types/Contact'
import {
  MessageBodyType,
  RequestAttestationForClaim,
} from '../../types/Message'
import attestationService from '../../services/AttestationService'

import './ClaimView.scss'

type SelectOption = {
  value: string
  label: string
}

type Props = RouteComponentProps<{ hash: string }> & {
  claimEntries: Claims.Entry[]
  removeClaim: (hash: string) => void
}

type State = {
  attestants: Contact[]
  isSelectAttestantsOpen: boolean
  currentClaimEntry?: Claims.Entry | 'notFoundInList'
}

class ClaimView extends React.Component<Props, State> {
  public selectedAttestants: Contact[] = []
  private filterConfig: Config = {
    ignoreAccents: true,
    ignoreCase: true,
    matchFrom: 'any',
    trim: true,
  }
  private selectAttestantModal: Modal | null
  private claimHashToAttest: string

  constructor(props: Props) {
    super(props)
    this.state = {
      attestants: [],
      isSelectAttestantsOpen: false,
    }
    this.deleteClaim = this.deleteClaim.bind(this)
    this.onRequestAttestation = this.onRequestAttestation.bind(this)
    this.onCancelRequestAttestation = this.onCancelRequestAttestation.bind(this)
    this.onFinishRequestAttestation = this.onFinishRequestAttestation.bind(this)
    this.onSelectAttestants = this.onSelectAttestants.bind(this)
    this.setSelectAttestantsOpen = this.setSelectAttestantsOpen.bind(this)
  }

  public componentDidMount() {
    ContactRepository.findAll()
      .then((attestants: Contact[]) => {
        this.setState({ attestants })
      })
      .catch(error => {
        ErrorService.log({
          error,
          message: 'Could not fetch contacts (attestants)',
          origin: 'ClaimView.componentDidMount()',
          type: 'ERROR.FETCH.GET',
        })
      })
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
    const { currentClaimEntry, isSelectAttestantsOpen } = this.state

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
            this.selectAttestantModal = el
          }}
          type={ModalType.CONFIRM}
          header="Select Attestant(s):"
          onCancel={this.onCancelRequestAttestation}
          onConfirm={this.onFinishRequestAttestation}
          catchBackdropClick={isSelectAttestantsOpen}
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
    const { attestants } = this.state

    const options: SelectOption[] = attestants.map((attestant: Contact) => ({
      label: attestant.name,
      value: attestant.key,
    }))

    return (
      <Select
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable={true}
        isSearchable={true}
        isMulti={true}
        closeMenuOnSelect={false}
        name="selectAttestants"
        options={options}
        onChange={this.onSelectAttestants}
        onMenuOpen={this.setSelectAttestantsOpen(true)}
        onMenuClose={this.setSelectAttestantsOpen(false, 500)}
        filterOption={createFilter(this.filterConfig)}
      />
    )
  }

  private onSelectAttestants(selectedOptions: any) {
    const { attestants } = this.state

    this.selectedAttestants = attestants.filter((attestant: Contact) =>
      selectedOptions.find(
        (option: SelectOption) => option.value === attestant.key
      )
    )
  }

  private async onVerifyAttestation(
    attestation: sdk.IAttestation
  ): Promise<boolean> {
    return attestationService.verifyAttestation(attestation)
  }

  private onRequestAttestation(hash: string) {
    this.claimHashToAttest = hash
    if (this.selectAttestantModal) {
      this.selectAttestantModal.show()
    }
  }

  private onCancelRequestAttestation() {
    this.selectedAttestants = []
  }

  private onFinishRequestAttestation() {
    const { claimEntries } = this.props

    const claimToAttest = claimEntries.find(
      (claimEntry: Claims.Entry) =>
        claimEntry.claim.hash === this.claimHashToAttest
    )

    if (claimToAttest) {
      this.selectedAttestants.forEach((attestant: Contact) => {
        const request: RequestAttestationForClaim = {
          content: claimToAttest.claim,
          type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
        }
        MessageRepository.send(attestant, request)
          .then(() => {
            notifySuccess('Request for attestation successfully sent.')
          })
          .catch(error => {
            ErrorService.log({
              error,
              message: `Could not send message ${request.type} to ${
                attestant.name
              }`,
              origin: 'ClaimView.componentDidMount()',
              type: 'ERROR.FETCH.GET',
            })
          })
      })
    }
  }

  private setSelectAttestantsOpen = (
    isSelectAttestantsOpen: boolean,
    delay = 0
  ) => () => {
    setTimeout(() => {
      this.setState({ isSelectAttestantsOpen })
    }, delay)
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
