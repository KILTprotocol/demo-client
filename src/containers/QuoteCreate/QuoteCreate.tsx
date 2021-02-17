import { ICType, IQuote } from '@kiltprotocol/types'
import React from 'react'
import { withRouter, RouteComponentProps } from 'react-router'
import * as common from 'schema-based-json-editor'
import DayPickerInput from 'react-day-picker/DayPickerInput'
import QuoteInputSchema from '../../utils/QuoteUtils/QuoteInputSchema'
import SchemaEditor from '../../components/SchemaEditor/SchemaEditor'
import * as Quotes from '../../state/ducks/Quotes'

import 'react-day-picker/lib/style.css'

import './QuoteCreate.scss'

type OwnProps = {
  cTypeHash?: ICType['hash']
  claimerAddress?: string
  attesterAddress?: string
  onCancel?: () => void
  newQuote: (quote: IQuote) => void
}

type Props = RouteComponentProps<{ quoteId: Quotes.Entry['quoteId'] }> &
  OwnProps

type State = {
  quote?: IQuote
  initialValue?: object
  startDate: Date
}

class QuoteCreate extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { attesterAddress, cTypeHash } = this.props
    this.state = {
      startDate: new Date(),
      initialValue: {
        attesterAddress,
        cTypeHash,
      },
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateValue = this.updateValue.bind(this)
  }

  public updateValue = (value: IQuote): void => {
    const quote = value
    const result = {}
    Object.keys(value.cost.tax).forEach(entryKey => {
      result[entryKey] = value.cost.tax[entryKey]
    })
    quote.cost.tax = result

    this.setState({ quote })
  }

  private handleChange = (date: Date): void => {
    this.setState({
      startDate: date,
    })
  }

  private handleSubmit(): void {
    const { claimerAddress, newQuote } = this.props
    const { quote, startDate } = this.state
    if (quote && claimerAddress) {
      quote.timeframe = startDate
      newQuote(quote)
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
      <div className="QuoteCreate">
        <div>
          <label> Time Frame</label>
          <DayPickerInput onDayChange={this.handleChange} />
          <SchemaEditor
            schema={QuoteInputSchema as common.Schema}
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
      </div>
    )
  }
}

export default withRouter(QuoteCreate)
