import './QuoteView.scss'
import React from 'react'
import { connect } from 'react-redux'
import { MyIdentity } from '../../types/Contact'
import * as sdk from '@kiltprotocol/sdk-js'
import QuoteJSON from './Quote.json'
import * as Wallet from '../../state/ducks/Wallet'
import * as Quotes from '../../state/ducks/Quotes'
import QuoteCreate from '../../containers/QuoteCreate/QuoteCreate'

import Code from '../../components/Code/Code'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import { State as ReduxState } from '../../state/PersistentStore'

type Props = RouteComponentProps<{}> & {
  selectedIdentity: MyIdentity
  claim: sdk.IPartialClaim
  quoteEntries?: Quotes.Entry[]
  senderAddress?: string
  receiverAddress?: string
  onCancel?: () => void
}

type State = {}

class QuoteView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
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
    const {
      quoteEntries,
      onCancel,
      senderAddress,
      receiverAddress,
      claim,
    } = this.props

    const isQuoteView = this.isQuoteView()

    return (
      <section>
        <h1>Quotes </h1>{' '}
        {!isQuoteView ? (
          <section className="QuoteView">
            <div>
              <label>Quote</label>
              <span>
                <Code>{quoteEntries}</Code>
              </span>
            </div>
          </section>
        ) : (
          <section className="QuoteView">
            <span>
              <h2>No Quote</h2>
            </span>
          </section>
        )}
        {this.createQuote ? (
          <section>
            <div className="actions">
              <button className="submit-cType" onClick={this.createQuote}>
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
            />
          </section>
        )}
      </section>
    )
  }

  private isQuoteView() {
    const { quoteEntries } = this.props
    return !!(quoteEntries && quoteEntries.length)
  }
  private createQuote() {
    this.setState({ createNewQuote: true })
  }

  private onCancelQuote() {
    const { onCancel } = this.props

    if (onCancel) {
      onCancel()
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
  quoteEntries: Quotes.getAllMyQuotes(state),
})

export default connect(mapStateToProps)(withRouter(QuoteView))
