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
  updateQuote: (quote: sdk.IQuote) => void
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
    const {
      senderAddress,
      receiverAddress,
      selectedIdentity,
      claim,
    } = this.props
    if (!senderAddress && !receiverAddress) {
      senderAddress === selectedIdentity.identity.address
      receiverAddress === ' '
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
    if (quoteID && !newQuote) {
      const selectedQuote = Quotes.getQuoteByQuoteHash(
        PersistentStore.store.getState(),
        quoteID
      )[0]

      if (newQuote !== selectedQuote.quote) {
        this.setState({ newQuote: selectedQuote.quote })
        this.props.updateQuote(selectedQuote.quote)
      }
    }
  }

  public render() {
    const { senderAddress, receiverAddress, claim } = this.props

    const { createNewQuote, quoteID, newQuote } = this.state

    return quoteID && newQuote ? (
      <section className="QuoteView">
        <h1>Quote </h1>
        <div>
          <span>
            <Code>{newQuote}</Code>
          </span>
        </div>
      </section>
    ) : !createNewQuote ? (
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
          cTypeHash={claim?.cTypeHash}
          onCancel={this.onCancelQuote}
          quoteId={this.quoteId}
        />
      </section>
    )
  }

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
