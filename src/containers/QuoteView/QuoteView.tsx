import './QuoteView.scss'
import React from 'react'
import { connect } from 'react-redux'
import { MyIdentity } from '../../types/Contact'
import * as sdk from '@kiltprotocol/sdk-js'
import * as Wallet from '../../state/ducks/Wallet'
import * as Quotes from '../../state/ducks/Quotes'
import QuoteCreate from '../../containers/QuoteCreate/QuoteCreate'

import Code from '../../components/Code/Code'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'

type Props = RouteComponentProps<{}> & {
  selectedIdentity: MyIdentity
  claim: sdk.IPartialClaim
  quoteEntries?: Quotes.Entry[]
  senderAddress?: string
  receiverAddress?: string
}

type State = {
  createNewQuote: boolean
  redirect?: string
  newQuote?: Quotes.Entry
}

class QuoteView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { createNewQuote: false }
    this.createQuote = this.createQuote.bind(this)
    this.onCancelQuote = this.onCancelQuote.bind(this)
  }

  public componentDidUpdate(prevProps: Props) {
    if (
      prevProps.selectedIdentity.identity.address !==
      this.props.selectedIdentity.identity.address
    ) {
      this.setState({
        redirect: '/quote',
      })
    }
  }

  public render() {
    const { senderAddress, receiverAddress, claim } = this.props

    const { createNewQuote, newQuote } = this.state

    const isQuoteView = this.isQuoteView()

    return (
      <section className="QuoteView">
        <h1>Quote </h1>
        {!isQuoteView ? (
          <section className="QuoteView">
            <span>
              <h2>No Quote</h2>
            </span>
          </section>
        ) : (
          <section className="QuoteView">
            <div>
              <label>Quote</label>
              <span>
                <Code>{this.selectQuote(newQuote)}</Code>
              </span>
            </div>
          </section>
        )}
        {!createNewQuote ? (
          <section>
            <div className="actions">
              <button className="submit-quote" onClick={this.createQuote}>
                Create new Quote
              </button>
            </div>
          </section>
        ) : (
          <section>
            <QuoteCreate
              claimerAddress={senderAddress}
              attesterAddress={receiverAddress}
              cTypeHash={claim.cTypeHash}
              onCancel={this.onCancelQuote}
            />
          </section>
        )}
      </section>
    )
  }

  private selectQuote(quoteEntry: Quotes.Entry | undefined) {
    if (quoteEntry) {
      const selectedQuoteEntry = Quotes.getQuote(
        PersistentStore.store.getState(),
        quoteEntry.created
      ).quote
      return selectedQuoteEntry
    }
    return undefined
  }

  private isQuoteView() {
    const {  quoteEntries } = this.props
    return !!(quoteEntries && quoteEntries.length)
  }

  private createQuote() {
    this.setState({ createNewQuote: true })
  }

  private onCancelQuote() {
    this.setState({ createNewQuote: false })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
  quoteEntries: Quotes.getAllMyQuotes(state),
})

export default connect(mapStateToProps)(withRouter(QuoteView))
