import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import SelectAttestedClaims from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import withSelectAttestedClaims, {
  IInjectedProps as InjectedSelectProps,
} from '../../../components/withSelectAttestedClaims/withSelectAttestedClaims'
import AttestationWorkflow from '../../../services/AttestationWorkflow'
import { IMyDelegation } from '../../../state/ducks/Delegations'
import { IContact } from '../../../types/Contact'

import './SubmitClaimsForCType.scss'

export type SubmitClaimsForCTypeProps = {
  cTypeHashes: Array<sdk.ICType['hash']>
  receiverAddresses: Array<IContact['publicIdentity']['address']>

  onFinished?: () => void
  onCancel?: () => void
}

type Props = InjectedSelectProps & SubmitClaimsForCTypeProps

type State = {
  selectedDelegation?: IMyDelegation
}

class SubmitClaimsForCType extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.sendClaim = this.sendClaim.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private sendClaim(): void {
    const { receiverAddresses, onFinished, getAttestedClaims } = this.props

    AttestationWorkflow.submitClaimsForCTypes(
      getAttestedClaims(),
      receiverAddresses
    ).then(() => {
      if (onFinished) {
        onFinished()
      }
    })
  }

  public render(): JSX.Element {
    const {
      cTypeHashes,
      claimSelectionData,

      onChange,
    } = this.props

    return (
      <section className="SubmitClaimsForCType">
        <section className="selectAttestedClaims">
          <h2>Select attested claim(s)</h2>

          <SelectAttestedClaims cTypeHashes={cTypeHashes} onChange={onChange} />

          <div className="actions">
            <button type="button" onClick={this.onCancel}>
              Cancel
            </button>
            <button
              type="button"
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
}

export default withSelectAttestedClaims(SubmitClaimsForCType)
