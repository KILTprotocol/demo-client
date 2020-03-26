import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { State as ReduxState } from '../../state/PersistentStore'
import SchemaEditor from '../../components/SchemaEditor/SchemaEditor'
import * as common from 'schema-based-json-editor'
import * as Quotes from '../../state/ducks/Quotes'
import * as Wallet from '../../state/ducks/Wallet'

import './QuoteCreate.scss'

type Props = RouteComponentProps<{}> & {
  cTypeHash?: sdk.ICType['hash']
  claimerAddress?: string
  attesterAddress?: string
  saveQuote: (
    attesterSignedQuote: sdk.IQuoteAttesterSigned,
    claimerIdentity: string
  ) => void
  selectedIdentity: Wallet.Entry
  onCancel?: () => void
  quoteId: (quoteId: Quotes.Entry['quoteId']) => void
}

type State = {
  quote?: sdk.IQuote
  isValid: boolean
  initialValue: object
}

class QuoteCreate extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      quote: undefined,
      isValid: true,
      initialValue: {
        cTypeHash: this.props.cTypeHash,
        attesterAddress: this.props.attesterAddress,
      },
    }
    this.handleCancel = this.handleCancel.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateValue = this.updateValue.bind(this)
  }

  render() {
    const { onCancel } = this.props
    const { initialValue } = this.state

    return (
      <section className="QuoteCreate">
        <h2>Quote</h2>
        <div>
          <SchemaEditor
            schema={sdk.QuoteSchema as common.Schema}
            initialValue={initialValue}
            updateValue={this.updateValue}
          />
        </div>
        <section className="actions">
          {onCancel && <button onClick={this.handleCancel}>Cancel</button>}

          <button onClick={this.handleSubmit}>Confirm Quote</button>
        </section>
      </section>
    )
  }

  private handleCancel() {
    const { onCancel } = this.props

    if (onCancel) {
      onCancel()
    }
  }

  private handleSubmit() {
    const { saveQuote, selectedIdentity, claimerAddress, quoteId } = this.props

    const { quote } = this.state

    if (quote && claimerAddress) {
      quoteId(Quotes.hash(quote))
      quote.timeframe = new Date()
      const attesterSignedQuote = sdk.Quote.fromQuoteDataAndIdentity(
        quote,
        selectedIdentity.identity
      )
      saveQuote(attesterSignedQuote, claimerAddress)
    }
  }

  public updateValue = (value: sdk.IQuote) => {
    if (!sdk.Quote.validateQuoteSchema(sdk.QuoteSchema, value)) {
      this.setState({ isValid: false })
    }
    this.setState({ quote: value, isValid: true })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps = (dispatch: (action: Quotes.Action) => void) => {
  return {
    saveQuote: (
      attesterSignedQuote: sdk.IQuoteAgreement,
      claimerAddress: string
    ) => {
      dispatch(Quotes.Store.saveQuote(attesterSignedQuote, claimerAddress))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(QuoteCreate))
