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

type SelectOption = {
  value: string
  label: string
}

type Props = RouteComponentProps<{ id: string }> & {
  claims: Claims.Entry[]
  removeClaim: (id: string) => void
}

type State = {
  attestants: Contact[]
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
  private claimIdToAttest: string

  constructor(props: Props) {
    super(props)
    this.state = {
      attestants: [],
    }
    this.deleteClaim = this.deleteClaim.bind(this)
    this.onRequestAttestation = this.onRequestAttestation.bind(this)
    this.onCancelRequestAttestation = this.onCancelRequestAttestation.bind(this)
    this.onFinishRequestAttestation = this.onFinishRequestAttestation.bind(this)
    this.onSelectAttestants = this.onSelectAttestants.bind(this)
  }

  public componentDidMount() {
    ContactRepository.findAll().then((attestants: Contact[]) => {
      this.setState({ attestants })
    })
  }

  public render() {
    const { id } = this.props.match.params
    const { claims } = this.props
    let currentClaim
    if (id) {
      currentClaim = this.getCurrentClaim()
    }
    return (
      <section className="ClaimView">
        {!!id && (
          <ClaimDetailView
            claim={currentClaim}
            onRemoveClaim={this.deleteClaim}
            onRequestAttestation={this.onRequestAttestation}
          />
        )}
        {!id && (
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
        >
          {this.getSelectAttestants()}
        </Modal>
      </section>
    )
  }

  private getCurrentClaim(): Claims.Entry | undefined {
    const { id } = this.props.match.params
    const { claims } = this.props
    return claims.find((claim: Claims.Entry) => claim.id === id)
  }

  private deleteClaim(id: string) {
    const { removeClaim } = this.props
    removeClaim(id)
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

  private onRequestAttestation(id: string) {
    this.claimIdToAttest = id
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
      (claim: Claims.Entry) => claim.id === this.claimIdToAttest
    )

    if (claimToAttest) {
      this.selectedAttestants.forEach((attestant: Contact) => {
        MessageRepository.send(attestant, {
          content: claimToAttest,
          type: 'request-attestation-for-claim',
        })
      })
    }
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
    removeClaim: (id: string) => {
      dispatch(Claims.Store.removeAction(id))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(ClaimView))
