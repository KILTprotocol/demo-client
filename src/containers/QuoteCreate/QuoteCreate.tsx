import * as sdk from '@kiltprotocol/sdk-js'
import React, { useState } from 'react'
import PersistentStore from '../../state/PersistentStore'
import SchemaEditor from '../../components/SchemaEditor/SchemaEditor'
import * as common from 'schema-based-json-editor'
import { QuoteInputModel } from '../../utils/QuoteUtils/QuoteInputSchema'

import './QuoteCreate.scss'

type Props = {
  onCancelQuote: () => void
  createNewQuote?: boolean
  quoteConfirm: (value?: sdk.IQuote) => void
}
type State = {
  quote?: sdk.IQuote
  isValid: boolean
}

class QuoteCreate extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      quote: undefined,
      isValid: false,
    }
  }
  render() {
    const { onCancelQuote, quoteConfirm } = this.props
    return (
      <section className="QuoteCreate">
        <h2>Quote</h2>
        <div>
          <SchemaEditor
            schema={QuoteInputModel as common.Schema}
            initialValue={undefined}
            updateValue={this.updateValue}
          />
        </div>
        <section className="actions">
          <div>
            <button onClick={() => onCancelQuote()}>Cancel Quote</button>

            <button
              onClick={() => {
                quoteConfirm(this.state.quote)
                onCancelQuote()
              }}
            >
              Confirm Quote
            </button>
          </div>
        </section>
      </section>
    )
  }

  private getQuoteInput(value: sdk.IQuote): boolean {
    return sdk.Quote.validateQuoteSchema(QuoteInputModel, value)
  }

  private updateValue = (value: sdk.IQuote, isValid: boolean) => {
    if (!this.getQuoteInput(value)) {
      this.setState({ quote: value, isValid: false })
    }
    this.setState({ quote: value, isValid: isValid })
  }
}
export default QuoteCreate
