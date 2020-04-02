import React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { connect, MapStateToProps } from 'react-redux'
import { State as ReduxState } from '../../state/PersistentStore'
import * as Quotes from '../../state/ducks/Quotes'
import Code from '../../components/Code/Code'
import './MyQuotesList.scss'

type DispatchProps = {
  removeQuote: (claimId: Quotes.Entry['quoteId']) => void
}

type OwnProps = {}

type StateProps = {
  quoteEntries?: Quotes.Entry[]
}

type Props = RouteComponentProps<{ quoteId: Quotes.Entry['quoteId'] }> &
  StateProps &
  DispatchProps &
  OwnProps

class MyQuotesList extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.deleteQuote = this.deleteQuote.bind(this)
  }

  private deleteQuote(quoteId: Quotes.Entry['quoteId']): void {
    const { removeQuote } = this.props

    removeQuote(quoteId)
  }

  public render(): JSX.Element {
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
                    <button
                      type="button"
                      onClick={() => this.deleteQuote(val.quoteId)}
                    >
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
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  quoteEntries: Quotes.getAllMyQuotes(state),
})

const mapDispatchToProps: DispatchProps = {
  removeQuote: (quoteId: Quotes.Entry['quoteId']) => {
    Quotes.Store.removeQuote(quoteId)
  },
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(MyQuotesList))
