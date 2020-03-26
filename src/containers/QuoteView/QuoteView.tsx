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
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'

type Props = RouteComponentProps<{ quoteId: Quotes.Entry['quoteId'] }> & {
  selectedIdentity: MyIdentity
  claim: sdk.IPartialClaim
  quoteEntries?: Quotes.Entry[]
  senderAddress?: string
  receiverAddress?: string
}

type State = {
  createNewQuote: boolean
  redirect?: string
  quoteID?: Quotes.Entry['quoteId']
  newQuote?: Quotes.QuoteEntry
}

class QuoteView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { createNewQuote: false }
    this.createQuote = this.createQuote.bind(this)
    this.onCancelQuote = this.onCancelQuote.bind(this)
    this.quoteId = this.quoteId.bind(this)
  }

  public componentDidMount() {
    const { quoteEntries } = this.props
    const { quoteID } = this.state
    if (quoteEntries && quoteID) {
      console.log('this is broken?', quoteID, PersistentStore.store.getState())
      const selectedQuote = Quotes.getQuoteByQuoteHash(
        PersistentStore.store.getState(),
        quoteID
      )
      if (!selectedQuote) {
        throw new Error('No quote selected')
      }
      console.log('this is undefined', selectedQuote)
      // this.setState({ newQuote: attesterSignedQuote })
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const { newQuote, quoteID } = this.state
    if (
      prevProps.selectedIdentity.identity.address !==
      this.props.selectedIdentity.identity.address
    ) {
      this.setState({
        redirect: '/quote',
      })
    }
    if (quoteID) {
      this.setState({
        newQuote: Quotes.getQuoteByQuoteHash(
          PersistentStore.store.getState(),
          quoteID
        )[0].quote,
      })
      if (newQuote) {
        return
      }
    }
  }

  public render() {
    const { senderAddress, receiverAddress, claim } = this.props

    const { createNewQuote, quoteID, newQuote } = this.state

    return quoteID && newQuote ? (
      <section className="QuoteView">
        <h1>Quote </h1>
        <section className="QuoteView">
          <div>
            <label>Quote</label>
            <span>
              <Code>{newQuote}</Code>
            </span>
          </div>
        </section>
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
              quoteId={this.quoteId}
            />
          </section>
        )}
      </section>
    ) : (
      <section className="QuoteView">
        <h1>Quote </h1>
        <section className="QuoteView">
          <span>
            <h2>No Quote</h2>
          </span>
        </section>
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
              quoteId={this.quoteId}
            />
          </section>
        )}
      </section>
    )
  }

  // private selectQuote() {
  //   const { quoteID } = this.state

  //   if (quoteID) {
  //   }
  // }

  private createQuote() {
    this.setState({ createNewQuote: true })
  }

  private onCancelQuote() {
    this.setState({ createNewQuote: false })
  }
  private quoteId(quoteId: Quotes.Entry['quoteId']) {
    this.setState({ quoteID: quoteId })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
  quoteEntries: Quotes.getAllMyQuotes(state),
})

export default connect(mapStateToProps)(withRouter(QuoteView))
