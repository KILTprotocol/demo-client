import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import Select, { createFilter } from 'react-select'
import { Config } from 'react-select/lib/filters'

import ClaimDetailView from '../../components/ClaimDetailView/ClaimDetailView'
import ClaimListView from '../../components/ClaimListView/ClaimListView'
import Modal from '../../components/Modal/Modal'
import ContactRepository from '../../services/ContactRepository'
import MessageRepository from '../../services/MessageRepository'
import * as Claims from '../../state/ducks/Claims'
import { Contact } from '../../types/Contact'
import { MessageBodyType } from '../../types/Message'

import './ClaimView.scss'

type SelectOption = {
  value: string
  label: string
}

type Props = RouteComponentProps<{ hash: string }> & {
  claims: Claims.Entry[]
  removeClaim: (hash: string) => void
}

type State = {
  attestants: Contact[]
  isSelectAttestantsOpen: boolean
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
    ContactRepository.findAll().then((attestants: Contact[]) => {
      this.setState({ attestants })
    })
  }

  public render() {
    const { hash } = this.props.match.params
    const { claims } = this.props
    const { isSelectAttestantsOpen } = this.state

    let currentClaim
    if (hash) {
      currentClaim = this.getCurrentClaim()
    }
    return (
      <section className="ClaimView">
        {!!hash && (
          <ClaimDetailView
            claim={currentClaim}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.onRequestAttestation}
          />
        )}
        {!hash && (
          <ClaimListView
            claims={claims}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.onRequestAttestation}
          />
        )}
        <Modal
          ref={el => {
            this.selectAttestantModal = el
          }}
          type="confirm"
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

  private getCurrentClaim(): Claims.Entry | undefined {
    const { hash } = this.props.match.params
    const { claims } = this.props
    return claims.find((claim: Claims.Entry) => claim.hash === hash)
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
    const { claims } = this.props

    const claimToAttest = claims.find(
      (claim: Claims.Entry) => claim.hash === this.claimHashToAttest
    )

    if (claimToAttest) {
      this.selectedAttestants.forEach((attestant: Contact) => {
        MessageRepository.send(attestant, {
          content: claimToAttest,
          type: MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
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
    claims: state.claims
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
