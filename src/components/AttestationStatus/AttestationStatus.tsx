import { IAttestation, IAttestedClaim } from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import AttestationService from '../../services/AttestationService'
import * as Claims from '../../state/ducks/Claims'
import * as UiState from '../../state/ducks/UiState'
import * as Attestations from '../../state/ducks/Attestations'
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

function isAttestedClaim(
  arg: IAttestedClaim | IAttestation
): arg is IAttestedClaim {
  return (arg as IAttestedClaim).request !== undefined
}

type StateProps = {
  attestationStatusCycle: number
}

type OwnProps = {
  attestation: IAttestedClaim | IAttestation
}

type Props = StateProps & OwnProps

type State = {
  status?: STATUS
}

class AttestationStatus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    const attestation = isAttestedClaim(props.attestation)
      ? props.attestation.attestation
      : props.attestation

    this.state = {
      status: attestation.revoked ? STATUS.UNVERIFIED : undefined,
    }
  }

  public componentDidMount(): void {
    const { status } = this.state
    if (status !== STATUS.UNVERIFIED) {
      this.verifyAttestedClaim()
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    const { status } = this.state
    const { attestationStatusCycle } = this.props

    if (
      prevProps.attestationStatusCycle !== attestationStatusCycle &&
      status !== STATUS.UNVERIFIED &&
      status !== STATUS.PENDING
    ) {
      this.verifyAttestedClaim()
    }
  }

  private verifyAttestedClaim(): void {
    const { attestation } = this.props
    const { status } = this.state

    // if we are currently already fetching - cancel
    if (status === STATUS.PENDING) {
      return
    }

    this.setState({
      status: STATUS.PENDING,
    })

    const isAttested = isAttestedClaim(attestation)
      ? AttestationService.verifyAttestatedClaim(attestation)
      : AttestationService.verifyAttestation(attestation)

    isAttested.then((verified: boolean) => {
      if (verified) {
        this.setState({
          status: STATUS.ATTESTED,
        })
      } else {
        this.setState({
          status: STATUS.UNVERIFIED,
        })
        if (isAttestedClaim(attestation)) {
          PersistentStore.store.dispatch(
            Claims.Store.revokeAttestation(attestation.request.rootHash)
          )
        } else {
          PersistentStore.store.dispatch(
            Attestations.Store.revokeAttestation(attestation.claimHash)
          )
        }
      }
    })
  }

  public render(): JSX.Element {
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
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  attestationStatusCycle: UiState.getAttestationStatusCycle(state),
})

export default connect(mapStateToProps)(AttestationStatus)
