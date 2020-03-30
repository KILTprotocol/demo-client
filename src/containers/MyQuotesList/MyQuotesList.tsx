import React from 'react'
import { connect } from 'react-redux'
import { MyIdentity } from '../../types/Contact'
import * as Wallet from '../../state/ducks/Wallet'
import * as Quotes from '../../state/ducks/Quotes'
import Code from '../../components/Code/Code'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { State as ReduxState } from '../../state/PersistentStore'

type Props = RouteComponentProps<{ quoteId: Quotes.Entry['quoteId'] }> & {
  selectedIdentity: MyIdentity
  quoteEntries?: Quotes.Entry[]
}

type State = {
  redirect?: string
}

class MyQuotesList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
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
      <section className="QuoteView">
          <h1> My Quote list</h1>
        {quoteEntries ? (
          quoteEntries.map((val: Quotes.Entry) => {
            return (
              <section>
                <h2>Quote ID: {val.quoteId}</h2>
                <label>Claimer address : {val.claimerAddress}</label>
                <div>
                  <Code>{val.quote}</Code>
                </div>
              </section>
            )
          })
        ) : (
          <div>No Quotes</div>
        )}
      </section>
    )
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
  quoteEntries: Quotes.getAllMyQuotes(state),
})

export default connect(mapStateToProps)(withRouter(MyQuotesList))
