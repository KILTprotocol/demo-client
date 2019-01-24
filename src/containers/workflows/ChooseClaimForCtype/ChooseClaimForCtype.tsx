import { Attestation } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import Modal from '../../../components/Modal/Modal'
import SelectClaims from '../../../components/SelectClaims/SelectClaims'
import CtypeRepository from '../../../services/CtypeRepository'

import * as Claims from '../../../state/ducks/Claims'
import { Contact } from '../../../types/Contact'
import { CType } from '../../../types/Ctype'

type Props = {
  claimEntries: Claims.Entry[]
  ctypeKey: CType['key']
  onFinished?: () => void
}

type State = {
  ctype?: CType
  selectedClaim?: Claims.Entry
  selectedAttestants?: Contact[]
}

class ChooseClaimForCtype extends React.Component<Props, State> {
  public chooseClaimModal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {}

    this.selectClaim = this.selectClaim.bind(this)
  }

  public componentDidMount() {
    const { ctypeKey } = this.props

    CtypeRepository.findByKey(ctypeKey).then((ctype: CType) => {
      this.setState({ ctype })
    })
  }

  public render() {
    return (
      <section className="ChooseClaimAndAttestations">
        {this.getClaimSelect()}
        {this.getAttestionsSelect()}
      </section>
    )
  }

  private getClaimSelect() {
    const { claimEntries } = this.props
    const { ctype } = this.state

    if (!ctype) {
      return ''
    }

    const claims: Claims.Entry[] = claimEntries.filter(
      (claimEntry: Claims.Entry) => claimEntry.claim.ctype === ctype.key
    )
    return (
      !!claims &&
      !!claims.length && (
        <SelectClaims claims={claims} onChange={this.selectClaim} />
      )
    )
  }

  private selectClaim(claims: Claims.Entry[]) {
    this.setState({
      selectedClaim: claims[0],
    })
  }

  private getAttestionsSelect() {
    const { selectedClaim } = this.state
    return (
      !!selectedClaim &&
      // TODO: disable modals confirm button unless at least one attestation is
      // selected TODO: request attestation for selected claim
      (selectedClaim.attestations && selectedClaim.attestations.length ? (
        selectedClaim.attestations
          .filter((attestation: Attestation) => !attestation.revoked)
          .map((attestation: Attestation) => (
            <label key={attestation.signature}>
              <input type="checkbox" />
              {attestation.owner}
            </label>
          ))
      ) : (
        <div>
          No attestations found.
          <button>Request attestation?</button>
        </div>
      ))
    )
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

export default connect(mapStateToProps)(ChooseClaimForCtype)
