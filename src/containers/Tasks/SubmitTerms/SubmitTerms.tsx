import * as sdk from '@kiltprotocol/sdk-js'
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
import { MyDelegation } from '../../../state/ducks/Delegations'
import { Contact } from '../../../types/Contact'
import { ICTypeWithMetadata } from '../../../types/Ctype'
import { getClaimInputModel } from '../../../utils/CtypeUtils'
import './SubmitTerms.scss'
import QuoteView from '../../../containers/QuoteView/QuoteView'

export type SubmitTermsProps = {
  claim: sdk.IPartialClaim
  receiverAddresses: Array<Contact['publicIdentity']['address']>
  senderAddress?: string
  receiverAddress?: string
  enablePreFilledClaim?: boolean
  onFinished?: () => void
  onCancel?: () => void
}

type Props = InjectedSelectProps & SubmitTermsProps

type State = {
  claim: sdk.IPartialClaim
  cType?: ICTypeWithMetadata
  selectedDelegation?: MyDelegation
  createNewQuote?: boolean
  withPreFilledClaim?: boolean
  isValid: boolean
}

class SubmitTerms extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      claim: props.claim,
      isValid: false,
    }

    this.onCancel = this.onCancel.bind(this)
    this.changeDelegation = this.changeDelegation.bind(this)
    this.sendClaim = this.sendClaim.bind(this)
    this.updateClaim = this.updateClaim.bind(this)
    this.toggleWithPreFilledClaim = this.toggleWithPreFilledClaim.bind(this)
  }

  public componentDidMount() {
    const { claim } = this.state

    CTypeRepository.findByHash(claim.cTypeHash).then(
      (cType: ICTypeWithMetadata) => {
        this.setState({
          cType,
        })
      }
    )
  }

  public render() {
    const {
      claimSelectionData,
      enablePreFilledClaim,
      onChange,
      claim,
      senderAddress,
      receiverAddress,
    } = this.props

    const { cType, selectedDelegation, createNewQuote } = this.state
    return (
      <section className="SubmitTerms">
        {enablePreFilledClaim && cType && (
          <section className="preFillClaim">
            <h2 className="optional">Prefill claim</h2>
            {this.getPreFilledClaimElement()}
          </section>
        )}

        <>
          <div className="selectTerms">
            <h2>Select term(s)…</h2>
            <SelectAttestedClaims onChange={onChange} />
          </div>
          <div className="selectDelegation">
            <h2>…and/or a delegation</h2>
            <SelectDelegations
              isMulti={false}
              onChange={this.changeDelegation}
            />
          </div>
          <div>
            <QuoteView
              claim={claim}
              senderAddress={senderAddress}
              receiverAddress={receiverAddress}
            />
          </div>
          <div className="actions">
            <button onClick={this.onCancel}>Cancel</button>
            <button
              disabled={
                !Object.keys(claimSelectionData).length && !selectedDelegation
              }
              onClick={this.sendClaim}
            >
              Send Terms
            </button>
          </div>
        </>
      </section>
    )
  }

  private getPreFilledClaimElement() {
    const { cType, withPreFilledClaim } = this.state

    if (cType && withPreFilledClaim) {
      return (
        <>
          <div className="container-actions">
            <button onClick={this.toggleWithPreFilledClaim}>
              Without prefilled claim
            </button>
          </div>
          <SchemaEditor
            schema={getClaimInputModel(cType) as common.Schema}
            initialValue={undefined}
            updateValue={this.updateClaim}
          />
        </>
      )
    } else {
      return (
        <div className="container-actions">
          <button onClick={this.toggleWithPreFilledClaim}>
            With prefilled claim
          </button>
        </div>
      )
    }
  }

  private toggleWithPreFilledClaim() {
    const { withPreFilledClaim } = this.state
    this.setState({
      withPreFilledClaim: !withPreFilledClaim,
    })
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

  private onCancel() {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private sendClaim() {
    const {
      getAttestedClaims,
      enablePreFilledClaim,
      receiverAddresses,
      onFinished,
    } = this.props
    const { claim, selectedDelegation, withPreFilledClaim } = this.state

    const _claim: sdk.IPartialClaim = claim

    if (enablePreFilledClaim && !withPreFilledClaim) {
      delete _claim.contents
    }

    AttestationWorkflow.submitTerms(
      _claim,
      getAttestedClaims(),
      receiverAddresses,
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

export default withSelectAttestedClaims(SubmitTerms)
