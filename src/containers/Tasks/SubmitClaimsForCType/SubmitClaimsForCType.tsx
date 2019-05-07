import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import SelectAttestedClaims from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import withSelectAttestedClaims, {
  InjectedProps as InjectedSelectProps,
} from '../../../components/withSelectAttestedClaims/withSelectAttestedClaims'
import AttestationWorkflow from '../../../services/AttestationWorkflow'
import { MyDelegation } from '../../../state/ducks/Delegations'
import { Contact } from '../../../types/Contact'

import './SubmitClaimsForCType.scss'

export type SubmitClaimsForCTypeProps = {
  cTypeHash: sdk.ICType['hash']
  receiverAddresses: Array<Contact['publicIdentity']['address']>

  onFinished?: () => void
  onCancel?: () => void
}

type Props = InjectedSelectProps & SubmitClaimsForCTypeProps

type State = {
  selectedDelegation?: MyDelegation
}

class SubmitClaimsForCType extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.sendClaim = this.sendClaim.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  public render() {
    const {
      cTypeHash,
      claimSelectionData,

      onChange,
    } = this.props

    return (
      <section className="SubmitClaimsForCType">
        <section className="selectAttestedClaims">
          <h2>Select attested claim(s)</h2>

          <SelectAttestedClaims cTypeHash={cTypeHash} onChange={onChange} />

          <div className="actions">
            <button onClick={this.onCancel}>Cancel</button>
            <button
              disabled={!Object.keys(claimSelectionData).length}
              onClick={this.sendClaim}
            >
              Send attested claims
            </button>
          </div>
        </section>
      </section>
    )
  }

  private sendClaim() {
    const { receiverAddresses, onFinished, getAttestedClaims } = this.props

    AttestationWorkflow.submitClaimsForCtype(
      getAttestedClaims(),
      receiverAddresses
    ).then(() => {
      if (onFinished) {
        onFinished()
      }
    })
  }

  private onCancel() {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }
}

export default withSelectAttestedClaims(SubmitClaimsForCType)
