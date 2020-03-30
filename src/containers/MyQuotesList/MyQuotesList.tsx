import React from 'react'
import { connect } from 'react-redux'
import { MyIdentity } from '../../types/Contact'
import * as Wallet from '../../state/ducks/Wallet'
import * as Quotes from '../../state/ducks/Quotes'
import Code from '../../components/Code/Code'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { State as ReduxState } from '../../state/PersistentStore'
import './MyQuotesList.scss'

type Props = RouteComponentProps<{ quoteId: Quotes.Entry['quoteId'] }> & {
  selectedIdentity: MyIdentity
  quoteEntries?: Quotes.Entry[]
  removeQuote: (claimId: Quotes.Entry['quoteId']) => void
}

type State = {
  redirect?: string
}

class MyQuotesList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.deleteQuote = this.deleteQuote.bind(this)
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
    const { quoteEntries } = this.props

    return (
      <section>
        <h1>Quotes</h1>
        <section className="MyQuotesList">
          <h1> My Quote list</h1>

          {quoteEntries && quoteEntries.length ? (
            quoteEntries.map((val: Quotes.Entry) => {
              return (
                <section>
                  <h2>Quote ID: {val.quoteId}</h2>
                  <label>Claimer address : {val.claimerAddress}</label>
                  <div>
                    <Code>{val.quote}</Code>
                  </div>
                  <div className="actions">
                    <button onClick={() => this.deleteQuote(val.quoteId)}>
                      Delete Quote
                    </button>
                  </div>
                </section>
              )
            })
          ) : (
            <div>No Quotes</div>
          )}
        </section>
      </section>
    )
  }
  private deleteQuote(quoteId: Quotes.Entry['quoteId']) {
    const { removeQuote } = this.props

    removeQuote(quoteId)
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
  quoteEntries: Quotes.getAllMyQuotes(state),
})

const mapDispatchToProps = (dispatch: (action: Quotes.Action) => void) => {
  return {
    removeQuote: (quoteId: Quotes.Entry['quoteId']) => {
      dispatch(Quotes.Store.removeQuote(quoteId))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(MyQuotesList))
