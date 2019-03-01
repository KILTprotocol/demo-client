import React, { ChangeEvent, ReactNode } from 'react'
import { connect } from 'react-redux'
import Immutable from 'immutable'
import Spinner from '../../components/Spinner/Spinner'

import * as Balances from '../../state/ducks/Balances'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'

import './Balance.scss'

type Props = {
  balances: Immutable.Map<string, number>
  myIdentity?: MyIdentity
}

type State = {
  transferTokens?: number
}

class Balance extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.setTransferTokens = this.setTransferTokens.bind(this)
    this.transferTokens = this.transferTokens.bind(this)
  }

  public render() {
    const { balances, myIdentity } = this.props
    const _myIdentity =
      myIdentity || Wallet.getSelectedIdentity(PersistentStore.store.getState())

    const balance = balances.get(_myIdentity.identity.address)

    return (
      <section className="Balance">
        <h2>Manage Balance</h2>
        <div className="display">
          <label>Balance</label>
          {balance == null && (
            <Spinner size={20} color="#ef5a28" strength={3} />
          )}
          {balance != null && <div className="kilt-token">{balance}</div>}
        </div>
        {balance != null && (
          <div className="transfer-tokens">
            <label>Transfer</label>
            <div>{this.getTokenTransferElement(balance)}</div>
          </div>
        )}
      </section>
    )
  }

  private getTokenTransferElement(balance: number | undefined): ReactNode {
    if (balance === undefined) {
      return undefined
    }
    if (balance <= 0) {
      return <span>No sufficient funds to enable transfer.</span>
    }
    return (
      <React.Fragment>
        <input
          type="number"
          min={0}
          max={balance}
          onChange={this.setTransferTokens}
        />
        <button onClick={this.transferTokens}>Transfer</button>
      </React.Fragment>
    )
  }

  private setTransferTokens(e: ChangeEvent<HTMLInputElement>) {
    const { value: amount } = e.target
    console.log('setTransferTokens', amount)
    this.setState({ transferTokens: Number(amount) })
  }

  private transferTokens() {
    const { transferTokens } = this.state
    console.log('transferTokens', transferTokens)
    this.setState({ transferTokens: 0 })
  }
}

const mapStateToProps = (state: ReduxState) => {
  return {
    balances: Balances.getBalances(state),
  }
}

export default connect(mapStateToProps)(Balance)
