import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { Link } from 'react-router-dom'

import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import CTypePresentation from '../../components/CTypePresentation/CTypePresentation'
import delegationService from '../../services/DelegationsService'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import Spinner from '../../components/Spinner/Spinner'
import FeedbackService, {
  notifySuccess,
  notifyError,
} from '../../services/FeedbackService'
import { BlockUi } from '../../types/UserFeedback'

import './DelegationCreate.scss'

type StateProps = {
  selectedIdentity?: Wallet.Entry
}

type OwnProps = {
  isPCR: boolean
}

type Props = StateProps &
  RouteComponentProps<{
    cTypeHash: sdk.ICType['hash']
  }> &
  OwnProps

type State = {
  alias: string
  delegation?: sdk.DelegationRootNode
}

class DelegationCreate extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      alias: '',
    }
    this.handleNameChange = this.handleNameChange.bind(this)
    this.submit = this.submit.bind(this)
  }

  public componentDidMount(): void {
    const { match, selectedIdentity } = this.props
    const { cTypeHash } = match.params
    const { alias } = this.state

    if (selectedIdentity) {
      this.setState({
        alias,
        delegation: new sdk.DelegationRootNode(
          sdk.UUID.generate(),
          cTypeHash,
          selectedIdentity.identity.getAddress()
        ),
      })
    }
  }

  private handleNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      alias: e.target.value.trim(),
    })
  }

  private submit(): void {
    const { history, isPCR } = this.props
    const { delegation, alias } = this.state

    if (delegation) {
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Creating Root-Delegation',
      })

      delegationService
        .storeRoot(delegation, alias, isPCR)
        .then(() => {
          blockUi.remove()
          notifySuccess('Delegation successfully created')
          history.push('/delegations')
        })
        .catch(error => {
          blockUi.remove()
          notifyError(error)
        })
    }
  }

  public render(): JSX.Element {
    const { isPCR, match } = this.props
    const { cTypeHash } = match.params
    const { alias, delegation } = this.state
    return (
      <section className="DelegationCreate">
        <h1>{isPCR ? `New Root PCR` : `New Root Delegation`}</h1>
        {delegation ? (
          <>
            <div className="Delegation-base">
              <div>
                <label>Alias</label>
                <input type="text" onChange={this.handleNameChange} />
              </div>
              <div>
                <label>Id</label>
                <div>{delegation.id}</div>
              </div>
              <div>
                <label>CTYPE</label>
                <div>
                  <CTypePresentation cTypeHash={cTypeHash} interactive linked />
                </div>
              </div>
              <div>
                <label>Account</label>
                <div>
                  <ContactPresentation
                    address={delegation.account}
                    interactive
                  />
                </div>
              </div>
            </div>
            <div className="actions">
              <Link to={`/${isPCR ? 'pcrs' : 'delegations'}`}>Cancel</Link>
              <button
                type="button"
                className="submit-delegation"
                disabled={alias.length === 0}
                onClick={this.submit}
              >
                Submit
              </button>
            </div>
          </>
        ) : (
          <Spinner />
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
})

export default connect(mapStateToProps)(withRouter(DelegationCreate))
