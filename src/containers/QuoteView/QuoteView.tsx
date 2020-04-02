import './QuoteView.scss'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import * as sdk from '@kiltprotocol/sdk-js'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { IMyIdentity } from '../../types/Contact'
import * as Wallet from '../../state/ducks/Wallet'
import * as Quotes from '../../state/ducks/Quotes'
import QuoteCreate from '../QuoteCreate/QuoteCreate'
import Code from '../../components/Code/Code'

type StateProps = {
  selectedIdentity: IMyIdentity
  quoteEntries?: Quotes.Entry[]
}

type OwnProps = {
  claim: sdk.IPartialClaim
  senderAddress?: string
  receiverAddress?: string
  updateQuote: (quote: sdk.IQuote) => void
}

type Props = RouteComponentProps<{ quoteId: Quotes.Entry['quoteId'] }> &
  StateProps &
  OwnProps

type State = {
  createNewQuote: boolean
  quoteID?: Quotes.Entry['quoteId']
  newQuote?: Quotes.IQuoteEntry
}

class QuoteView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { createNewQuote: false }
    this.createQuote = this.createQuote.bind(this)
    this.onCancelQuote = this.onCancelQuote.bind(this)
    this.quoteId = this.quoteId.bind(this)
    this.confirmQuote = this.confirmQuote.bind(this)
  }

  public componentDidUpdate(): void {
    const { updateQuote } = this.props
    const { newQuote, quoteID } = this.state
    if (quoteID) {
      const selectedQuote = Quotes.getQuoteByQuoteHash(
        PersistentStore.store.getState(),
        quoteID
      )[0]
      if (newQuote !== selectedQuote.quote) {
        this.confirmQuote(selectedQuote.quote)
        updateQuote(selectedQuote.quote)
      }
    }
  }

  private onCancelQuote(): void {
    this.setState({ createNewQuote: false })
  }

  private createQuote(): void {
    this.setState({ createNewQuote: true })
  }

  private quoteId(quoteId: Quotes.Entry['quoteId']): void {
    this.setState({ quoteID: quoteId })
  }

  private confirmQuote(quote: Quotes.IQuoteEntry): void {
    if (quote) {
      this.setState({ newQuote: quote, createNewQuote: false })
    }
  }

  public render(): JSX.Element {
    const { senderAddress, receiverAddress, claim } = this.props

    const { createNewQuote, quoteID, newQuote } = this.state
    return (
      <section className="QuoteView">
        <h1>Quote </h1>
        {quoteID && newQuote ? (
          <div>
            <span>
              <Code>{newQuote}</Code>
            </span>
          </div>
        ) : (
          <div>No Quote</div>
        )}

        {!createNewQuote ? (
          <section>
            <div className="actions">
              <button
                type="button"
                className="submit-quote"
                onClick={this.createQuote}
              >
                Create new Quote
              </button>
            </div>
          </section>
        ) : (
          <section>
            <QuoteCreate
              claimerAddress={senderAddress}
              attesterAddress={receiverAddress}
              cTypeHash={claim?.cTypeHash}
              onCancel={this.onCancelQuote}
              quoteId={this.quoteId}
            />
          </section>
        )}
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
  quoteEntries: Quotes.getAllMyQuotes(state),
})

export default connect(mapStateToProps)(withRouter(QuoteView))
