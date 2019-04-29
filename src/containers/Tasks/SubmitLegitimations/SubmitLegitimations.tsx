import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import * as common from 'schema-based-json-editor'

import SchemaEditor from '../../../components/SchemaEditor/SchemaEditor'
import SelectAttestedClaims from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import SelectDelegations from '../../../components/SelectDelegations/SelectDelegations'
import withSelectAttestedClaims, {
  InjectedProps as InjectedSelectProps,
} from '../../../components/withSelectAttestedClaims/withSelectAttestedClaims'
import AttestationWorkflow from '../../../services/AttestationWorkflow'
import CTypeRepository from '../../../services/CtypeRepository'
import { DelegationType, MyDelegation } from '../../../state/ducks/Delegations'
import { Contact } from '../../../types/Contact'
import { ICType } from '../../../types/Ctype'

import './SubmitLegitimations.scss'

export type SubmitLegitimationsProps = {
  claim: sdk.IPartialClaim
  receiverAddresses: Array<Contact['publicIdentity']['address']>

  withPreFilledClaim?: boolean

  onFinished?: () => void
}

type Props = InjectedSelectProps & SubmitLegitimationsProps

type State = {
  claim: sdk.IPartialClaim
  cType?: sdk.CType
  selectedDelegation?: MyDelegation
}

class SubmitLegitimations extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      claim: props.claim,
    }

    this.changeDelegation = this.changeDelegation.bind(this)
    this.sendClaim = this.sendClaim.bind(this)
    this.updateClaim = this.updateClaim.bind(this)
  }

  public componentDidMount() {
    const { claim } = this.state

    CTypeRepository.findByHash(claim.cType).then((cType: ICType) => {
      this.setState({
        cType: sdk.CType.fromObject(cType.cType),
      })
    })
  }

  public render() {
    const {
      claimSelectionData,
      withPreFilledClaim,

      onChange,
    } = this.props

    const { claim, cType, selectedDelegation } = this.state

    return (
      <section className="SubmitLegitimations">

        {withPreFilledClaim && cType && (
          <section className="prefillClaim">
            <h2 className="optional">Prefill claim</h2>
            <SchemaEditor
              schema={cType.getClaimInputModel() as common.Schema}
              initialValue={undefined}
              updateValue={this.updateClaim}
            />
          </section>
        )}

        <>
          <div className="selectLegitimations">
            <h4>Select legitimation(s)</h4>
            <SelectAttestedClaims cTypeHash={claim.cType} onChange={onChange} />
          </div>

          <div className="selectDelegation">
            <h4>Select Delegation</h4>
            <SelectDelegations
              isMulti={false}
              onChange={this.changeDelegation}
              type={DelegationType.Node}
            />
          </div>

          <div className="actions">
            <button
              disabled={
                !Object.keys(claimSelectionData).length && !selectedDelegation
              }
              onClick={this.sendClaim}
            >
              Send Legitimations
            </button>
          </div>
        </>
      </section>
    )
  }

  private updateClaim(contents: sdk.IClaim['contents']) {
    const { claim } = this.state
    this.setState({
      claim: {
        ...claim,
        contents: {
          ...claim.contents,
          ...contents,
        },
      },
    })
  }

  private sendClaim() {
    const { getAttestedClaims, receiverAddresses, onFinished } = this.props
    const { claim, selectedDelegation } = this.state

    AttestationWorkflow.submitLegitimations(
      claim,
      getAttestedClaims(),
      receiverAddresses[0],
      selectedDelegation
    ).then(() => {
      if (onFinished) {
        onFinished()
      }
    })
  }

  private changeDelegation(selectedDelegations: MyDelegation[]) {
    this.setState({ selectedDelegation: selectedDelegations[0] })
  }
}

export default withSelectAttestedClaims(SubmitLegitimations)
