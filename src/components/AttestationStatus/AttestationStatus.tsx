import * as sdk from '@kiltprotocol/prototype-sdk'
import React from 'react'
import { connect } from 'react-redux'

import AttestationService from '../../services/AttestationService'
import * as Claims from '../../state/ducks/Claims'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import Spinner from '../Spinner/Spinner'

import './AttestationStatus.scss'

const enum STATUS {
  PENDING = 'pending',
  UNVERIFIED = 'unverified',
  ATTESTED = 'attested',
}

type Props = {
  attestedClaim: sdk.IAttestedClaim

  // redux
  attestationStatusCycle: number
}

type State = {
  status?: STATUS
}

class AttestationStatus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      status: props.attestedClaim.attestation.revoked
        ? STATUS.UNVERIFIED
        : undefined,
    }
  }

  public componentDidMount() {
    const { status } = this.state
    if (status !== STATUS.UNVERIFIED) {
      this.verifyAttestation()
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const { status } = this.state
    if (
      prevProps.attestationStatusCycle !== this.props.attestationStatusCycle &&
      status !== STATUS.UNVERIFIED &&
      status !== STATUS.PENDING
    ) {
      this.verifyAttestation()
    }
  }

  public render() {
    const { status } = this.state

    return (
      <section className={`AttestationStatus ${status}`}>
        {status === STATUS.PENDING && (
          <Spinner size={20} color="#ef5a28" strength={3} />
        )}
        {status === STATUS.ATTESTED && <div className="attested" />}
        {status === STATUS.UNVERIFIED && <div className="unverified" />}
      </section>
    )
  }

  private verifyAttestation() {
    const { attestedClaim } = this.props
    const { status } = this.state

    // if we are currently already fetching - cancel
    if (status === STATUS.PENDING) {
      return
    }

    this.setState({
      status: STATUS.PENDING,
    })

    AttestationService.verifyAttestatedClaim(attestedClaim).then(
      (verified: boolean) => {
        if (verified) {
          this.setState({
            status: STATUS.ATTESTED,
          })
        } else {
          this.setState({
            status: STATUS.UNVERIFIED,
          })
          PersistentStore.store.dispatch(
            Claims.Store.revokeAttestation(attestedClaim.request.hash)
          )
        }
      }
    )
  }
}

const mapStateToProps = (state: ReduxState) => ({
  attestationStatusCycle: UiState.getAttestationStatusCycle(state),
})

export default connect(mapStateToProps)(AttestationStatus)
