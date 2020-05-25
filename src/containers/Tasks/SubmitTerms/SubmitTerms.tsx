import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import * as common from 'schema-based-json-editor'

import SchemaEditor from '../../../components/SchemaEditor/SchemaEditor'
import SelectAttestedClaims from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import SelectDelegations from '../../../components/SelectDelegations/SelectDelegations'
import withSelectAttestedClaims, {
  IInjectedProps as InjectedSelectProps,
} from '../../../components/withSelectAttestedClaims/withSelectAttestedClaims'
import AttestationWorkflow from '../../../services/AttestationWorkflow'
import CTypeRepository from '../../../services/CtypeRepository'
import { IMyDelegation } from '../../../state/ducks/Delegations'
import { IContact } from '../../../types/Contact'
import { ICTypeWithMetadata } from '../../../types/Ctype'
import { getClaimInputModel } from '../../../utils/CtypeUtils'
import QuoteView from '../../QuoteView/QuoteView'
import PersistentStore from '../../../state/PersistentStore'
import * as Wallet from '../../../state/ducks/Wallet'
import './SubmitTerms.scss'

export type SubmitTermsProps = {
  claim: sdk.IPartialClaim
  receiverAddresses: Array<IContact['publicIdentity']['address']>
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
  selectedDelegation?: IMyDelegation
  withPreFilledClaim?: boolean
  quoteData?: sdk.IQuote
}

class SubmitTerms extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      claim: props.claim,
    }

    this.onCancel = this.onCancel.bind(this)
    this.changeDelegation = this.changeDelegation.bind(this)
    this.sendClaim = this.sendClaim.bind(this)
    this.updateClaim = this.updateClaim.bind(this)
    this.toggleWithPreFilledClaim = this.toggleWithPreFilledClaim.bind(this)
    this.updateQuote = this.updateQuote.bind(this)
  }

  public componentDidMount(): void {
    const { claim } = this.state

    CTypeRepository.findByHash(claim.cTypeHash).then(
      (cType: ICTypeWithMetadata) => {
        this.setState({
          cType,
        })
      }
    )
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private getPreFilledClaimElement(): JSX.Element {
    const { cType, withPreFilledClaim } = this.state

    if (cType && withPreFilledClaim) {
      return (
        <>
          <div className="container-actions">
            <button type="button" onClick={this.toggleWithPreFilledClaim}>
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
    }
    return (
      <div className="container-actions">
        <button type="button" onClick={this.toggleWithPreFilledClaim}>
          With prefilled claim
        </button>
      </div>
    )
  }

  private toggleWithPreFilledClaim(): void {
    const { withPreFilledClaim } = this.state
    this.setState({
      withPreFilledClaim: !withPreFilledClaim,
    })
  }

  private updateClaim(contents: sdk.IClaim['contents']): void {
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

  private updateQuote(quote: sdk.IQuote): void {
    const { quoteData } = this.state
    if (quoteData !== quote) {
      this.setState({ quoteData: quote })
    }
  }

  private sendClaim(): void {
    const {
      getAttestedClaims,
      enablePreFilledClaim,
      receiverAddresses,
      onFinished,
    } = this.props
    const {
      claim,
      selectedDelegation,
      withPreFilledClaim,
      quoteData,
    } = this.state

    if (enablePreFilledClaim && !withPreFilledClaim) {
      delete claim.contents
    }
    const selectedIdentity: sdk.Identity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    ).identity

    if (!selectedIdentity) {
      throw new Error('No identity selected')
    }
    const quote = quoteData ? sdk.Quote.createAttesterSignature(quoteData, selectedIdentity) : undefined
      AttestationWorkflow.submitTerms(
        claim,
        getAttestedClaims(),
        receiverAddresses,
        selectedDelegation,
        quote
      ).then(() => {
        if (onFinished) {
          onFinished()
        }
      })
  }

  private changeDelegation(selectedDelegations: IMyDelegation[]): void {
    this.setState({ selectedDelegation: selectedDelegations[0] })
  }

  public render(): JSX.Element {
    const {
      claimSelectionData,
      enablePreFilledClaim,
      onChange,
      claim,
      senderAddress,
      receiverAddress,
    } = this.props

    const { cType, selectedDelegation } = this.state

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
              updateQuote={this.updateQuote}
            />
          </div>

          <div className="actions">
            <button type="button" onClick={this.onCancel}>
              Cancel
            </button>
            <button
              type="button"
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
}

export default withSelectAttestedClaims(SubmitTerms)
