import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { Link } from 'react-router-dom'

import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import CTypePresentation from '../../components/CTypePresentation/CTypePresentation'
import CTypeRepository from '../../services/CtypeRepository'
import delegationService from '../../services/DelegationsService'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { ICType } from '../../types/Ctype'
import Spinner from '../../components/Spinner/Spinner'
import FeedbackService, {
  notifySuccess,
  notifyFailure,
} from '../../services/FeedbackService'
import { BlockUi } from '../../types/UserFeedback'

import './DelegationCreate.scss'

type Props = RouteComponentProps<{
  cTypeHash: sdk.ICType['hash']
}> & {
  selectedIdentity?: Wallet.Entry
}

type State = {
  cType?: ICType
  alias: string
  delegation?: sdk.DelegationRootNode
}

class DelegationCreate extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      alias: '',
      cType: undefined,
    }
    this.handleNameChange = this.handleNameChange.bind(this)
    this.submit = this.submit.bind(this)
  }

  public componentDidMount() {
    const ctypeHash = this.props.match.params.cTypeHash
    const { selectedIdentity } = this.props
    const { alias } = this.state
    CTypeRepository.findByHash(ctypeHash).then((cType: ICType) => {
      if (selectedIdentity) {
        this.setState({
          alias,
          cType,
          delegation: new sdk.DelegationRootNode(
            sdk.UUID.generate(),
            ctypeHash,
            selectedIdentity.identity.address
          ),
        })
      }
    })
  }

  public render() {
    const { cType, alias, delegation } = this.state
    return (
      <section className="DelegationCreate">
        <h1>New Root Delegation</h1>
        {delegation ? (
          <React.Fragment>
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
                  <CTypePresentation cType={cType} />
                </div>
              </div>
              <div>
                <label>Account</label>
                <div>
                  <ContactPresentation address={delegation.account} />
                </div>
              </div>
            </div>
            <div className="actions">
              <Link to="/delegations">Cancel</Link>
              <button
                className="submit-delegation"
                disabled={alias.length === 0}
                onClick={this.submit}
              >
                Submit
              </button>
            </div>
          </React.Fragment>
        ) : (
          <Spinner />
        )}
      </section>
    )
  }

  private handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      alias: e.target.value.trim(),
    })
  }

  private submit(): void {
    const { delegation, alias } = this.state
    const { history } = this.props
    if (delegation) {
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Creating Root-Delegation',
      })

      delegationService
        .storeRoot(delegation, alias)
        .then(() => {
          blockUi.remove()
          notifySuccess('Delegation successfully created')
          history.push('/delegations')
        })
        .catch(err => {
          console.log(err)
          blockUi.remove()
          notifyFailure('Delegation creation failed.')
        })
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(withRouter(DelegationCreate))
