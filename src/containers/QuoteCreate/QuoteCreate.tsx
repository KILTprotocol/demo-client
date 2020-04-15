import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import * as common from 'schema-based-json-editor'
import { IMyIdentity } from '../../types/Contact'
import { State as ReduxState } from '../../state/PersistentStore'
import SchemaEditor from '../../components/SchemaEditor/SchemaEditor'
import * as Quotes from '../../state/ducks/Quotes'
import * as Wallet from '../../state/ducks/Wallet'
import QuoteSchema from './QuoteSchema'

import './QuoteCreate.scss'

type StateProps = {
  selectedIdentity: IMyIdentity
}

type DispatchProps = {
  saveQuote: (
    attesterSignedQuote: sdk.IQuoteAttesterSigned,
    claimerIdentity: string
  ) => void
}

type OwnProps = {
  cTypeHash?: sdk.ICType['hash']
  claimerAddress?: string
  attesterAddress?: string
  onCancel?: () => void
  quoteId: (quoteId: Quotes.Entry['quoteId']) => void
}

type Props = RouteComponentProps<{ quoteId: Quotes.Entry['quoteId'] }> &
  StateProps &
  OwnProps &
  DispatchProps

type State = {
  quote?: sdk.IQuote
  initialValue?: object
}

class QuoteCreate extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { attesterAddress, cTypeHash } = this.props
    this.state = {
      initialValue: {
        attesterAddress,
        cTypeHash,
      },
    }
    this.handleCancel = this.handleCancel.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateValue = this.updateValue.bind(this)
  }

  public updateValue = (value: sdk.IQuote): void => {
    const quote = value
    // Need to add an input for dates to actually have a selection of the dates.
    quote.timeframe = new Date()
    
    const result = {}
    Object.keys(value.cost.tax).forEach(entryKey => {
      result[entryKey] = value.cost.tax[entryKey]
    })
    quote.cost.tax = result

      this.setState({ quote })
  }

  private handleSubmit(): void {
    const { saveQuote, selectedIdentity, claimerAddress, quoteId } = this.props
    const { quote } = this.state
    if (quote && claimerAddress) {
      quoteId(Quotes.hash(quote))
      const attesterSignedQuote = sdk.Quote.fromQuoteDataAndIdentity(
        quote,
        selectedIdentity.identity
      )
      saveQuote(attesterSignedQuote, claimerAddress)
    }
  }

  private handleCancel(): void {
    const { onCancel } = this.props

    if (onCancel) {
      onCancel()
    }
  }

  render(): JSX.Element {
    const { onCancel } = this.props
    const { initialValue } = this.state

    return (
      <section className="QuoteCreate">
        <h2>Quote</h2>
        <div>
          <SchemaEditor
            schema={QuoteSchema as common.Schema}
            initialValue={initialValue}
            updateValue={this.updateValue}
          />
        </div>
        <section className="actions">
          {onCancel && (
            <button type="button" onClick={this.handleCancel}>
              Cancel
            </button>
          )}

          <button type="button" onClick={this.handleSubmit}>
            Confirm Quote
          </button>
        </section>
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps: DispatchProps = {
  saveQuote: (
    attesterSignedQuote: sdk.IQuoteAttesterSigned,
    claimerAddress: string
  ) => Quotes.Store.saveQuote(attesterSignedQuote, claimerAddress),
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(QuoteCreate))
