import './QuoteView.scss'
import React from 'react'
import { connect } from 'react-redux'
import { MyIdentity } from '../../types/Contact'
import * as sdk from '@kiltprotocol/sdk-js'
import QuoteJSON from './Quote.json'
import * as Wallet from '../../state/ducks/Wallet'
import Code from '../../components/Code/Code'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import { State as ReduxState } from '../../state/PersistentStore'

type Props = RouteComponentProps<{}> & { selectedIdentity: MyIdentity }

type State = {}

class QuoteView extends React.Component<Props, State> {
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
        redirect: '/claim',
      })
    }
  }

  public render() {
    const { selectedIdentity } = this.props
    return QuoteJSON ? (
      <section>
        <h1>My Quotes </h1>{' '}
        <section className="QuoteView">
          <span>
            <h2>Quote details</h2>
          </span>
          <div>
            <label>
              Quote Name <span>{QuoteJSON.quoteMetadata.title}</span>
            </label>
          </div>
          <div>
            <label>Owner</label>
            <div>
              <ContactPresentation
                address={
                  QuoteJSON.quoteMetadata.owner ===
                  selectedIdentity.identity.address
                    ? selectedIdentity.identity.address
                    : QuoteJSON.quoteMetadata.owner
                }
                interactive={true}
              />
            </div>
          </div>
          <div>
            <label>Quote</label>
            <span>
              <Code>{QuoteJSON.quote}</Code>
            </span>
          </div>
        </section>
      </section>
    ) : (
      <section className="QuoteView">Quote not found</section>
    )
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(withRouter(QuoteView))
