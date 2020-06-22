import React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { connect, MapStateToProps } from 'react-redux'
import * as sdk from '@kiltprotocol/sdk-js'
import { State as ReduxState } from '../../state/PersistentStore'
import * as Quotes from '../../state/ducks/Quotes'
import * as Wallet from '../../state/ducks/Wallet'
import Code from '../../components/Code/Code'
import './MyQuotesList.scss'
import { IMyIdentity } from '../../types/Contact'

const enum STATUS {
  APPROVED = 'approved',
  NOTAPPROVED = 'notApproved',
}

type DispatchProps = {
  removeQuote: (claimId: Quotes.Entry['quoteId']) => void
}

type OwnProps = {}

type StateProps = {
  selectedIdentity: IMyIdentity
  quoteEntries: Quotes.Entry[]
}

type Props = RouteComponentProps<{ quoteId: Quotes.Entry['quoteId'] }> &
  StateProps &
  DispatchProps &
  OwnProps

type State = {
  status?: STATUS
}

class MyQuotesList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.deleteQuote = this.deleteQuote.bind(this)
    this.updateQuoteApproval = this.updateQuoteApproval.bind(this)
  }

  private updateQuoteApproval(quoteEntry: Quotes.IQuoteEntry): void {
    if (quoteEntry.attesterSignature) {
      // not able to do claimer signature... Union type problem
      this.setState({ status: STATUS.APPROVED })
    }
    if (!quoteEntry.attesterSignature) {
      // / not able to do claimer signature... Union type problem
      this.setState({ status: STATUS.NOTAPPROVED })
    }
  }

  private deleteQuote(quoteId: Quotes.Entry['quoteId']): void {
    const { removeQuote } = this.props
    removeQuote(quoteId)
  }

  public render(): JSX.Element {
    const { quoteEntries } = this.props
    const { status } = this.state
    return (
      <section>
        <h1>Quotes</h1>
        <section className="MyQuotesList">
          <h1> My Quote list</h1>
          <table>
            <thead>
              <tr>
                <th className="quoteId"> Quote Id</th>
                <th className="claimerAddress"> Claimer Address</th>
                <th className="quote"> Quote</th>
                <th className="status"> Claimer Signed</th>
                <th className="actions"> Actions</th>
              </tr>
            </thead>
            <tbody>
              {quoteEntries && quoteEntries.length ? (
                quoteEntries.map((val: Quotes.Entry, index) => {
                  const quoteItem = val
                  return (
                    <tr key={index.valueOf()}>
                      <td className="quoteId"> {quoteItem.quoteId}</td>
                      <td className="claimerAddress">
                        {quoteItem.claimerAddress}
                      </td>
                      <td className="quote">
                        <Code>{quoteItem.quote}</Code>
                      </td>
                      <td className="status">
                        {status === STATUS.NOTAPPROVED &&
                          this.updateQuoteApproval(quoteItem.quote) && (
                            <div className="notApproved" />
                          )}
                        {status === STATUS.APPROVED &&
                          this.updateQuoteApproval(quoteItem.quote) && (
                            <div className="approved" />
                          )}
                      </td>
                      <td className="actions">
                        <button
                          type="button"
                          title="Delete"
                          className="delete"
                          onClick={() => this.deleteQuote(quoteItem.quoteId)}
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <div>No Quotes</div>
              )}
            </tbody>
          </table>
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
  selectedIdentity: Wallet.getSelectedIdentity(state),
  quoteEntries: Quotes.getAllMyQuotes(state),
})

const mapDispatchToProps: DispatchProps = {
  removeQuote: (quoteId: Quotes.Entry['quoteId']) =>
    Quotes.Store.removeQuote(quoteId),
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(MyQuotesList))
