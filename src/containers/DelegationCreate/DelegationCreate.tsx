import * as sdk from '@kiltprotocol/prototype-sdk';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import ContactPresentation from 'src/components/ContactPresentation/ContactPresentation';
import CTypePresentation from 'src/components/CTypePresentation/CTypePresentation';
import CTypeRepository from '../../services/CtypeRepository';
import * as Wallet from '../../state/ducks/Wallet';
import { State as ReduxState } from '../../state/PersistentStore';
import { ICType } from '../../types/Ctype';
import './DelegationCreate.scss';
import Spinner from 'src/components/Spinner/Spinner';


type Props = RouteComponentProps<{
  cTypeHash: sdk.ICType['hash']
}> & {
  selectedIdentity?: Wallet.Entry
}

type State = {
  cType?: ICType
}

class DelegationCreate extends React.Component<Props, State> {

  private delegation: sdk.IDelegationRoot

  constructor(props: Props) {
    super(props)
    this.state = {
      cType: undefined
    }
  }

  public componentDidMount() {
    const ctypeHash = this.props.match.params.cTypeHash
    const {selectedIdentity} = this.props
    CTypeRepository.findByHash(ctypeHash).then(
      (cType: ICType) => {
        if (selectedIdentity) {
          this.delegation = new sdk.DelegationRoot(ctypeHash, selectedIdentity.identity.address)
        }
        this.setState({ cType })
      })
  }

  public render() {
    const { selectedIdentity } = this.props
    const { cType } = this.state
    return (
      <section className="DelegationCreate">
        <h1>New Root Delegation</h1>
        {(selectedIdentity && cType) ? (
          <React.Fragment>
            <div className="Delegation-base">
              <div>
                <label>Hash</label>
                <div>{this.delegation.hash}</div>
              </div>
              <div>
                <label>CTYPE</label>
                <div>
                  <CTypePresentation cType={cType} size={24} />
                </div>
              </div>
              <div>
                <label>Owner</label>
                <div>
                  <ContactPresentation address={this.delegation.owner} />
                </div>
              </div>
            </div>
            <div className="actions">
              <Link to="/delegations">Cancel</Link>
              <button
                className="submit-delegation"
                onClick={this.submit}
              >
                Submit
              </button>
            </div>
          </React.Fragment>
        ) : (<Spinner/>)}
      </section>
    )
  }

  private submit(): void {

  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(withRouter(DelegationCreate))
