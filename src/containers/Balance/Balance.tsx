import Immutable from 'immutable'
import React, { ChangeEvent, ReactNode } from 'react'
import { connect } from 'react-redux'
import SelectContactsModal from '../../components/Modal/SelectContactsModal'
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
  transferTokens: string
}

class Balance extends React.Component<Props, State> {
  private selectContactsModal: SelectContactsModal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      transferTokens: '',
    }

    this.setTransferTokens = this.setTransferTokens.bind(this)
    this.transferTokens = this.transferTokens.bind(this)
    this.showContactsModal = this.showContactsModal.bind(this)
    this.hideContactsModal = this.hideContactsModal.bind(this)
    this.cancelSelectContacts = this.cancelSelectContacts.bind(this)
    this.finishSelectContacts = this.finishSelectContacts.bind(this)
  }

  public render() {
    const myBalance = this.getMyBalance()

    return (
      <section className="Balance">
        <h2>Manage Balance</h2>
        <div className="display">
          <label>Balance</label>
          {myBalance == null && (
            <Spinner size={20} color="#ef5a28" strength={3} />
          )}
          {myBalance != null && <div className="kilt-token">{myBalance}</div>}
        </div>
        {myBalance != null && (
          <div className="transfer-tokens">
            <label>Transfer</label>
            <div>{this.getTokenTransferElement(myBalance)}</div>
          </div>
        )}
      </section>
    )
  }

  private getMyBalance(): number | undefined {
    const { balances, myIdentity } = this.props
    const _myIdentity =
      myIdentity || Wallet.getSelectedIdentity(PersistentStore.store.getState())

    return balances.get(_myIdentity.identity.address)
  }

  private getTokenTransferElement(balance: number | undefined): ReactNode {
    if (balance === undefined) {
      return undefined
    }
    if (balance <= 0) {
      return <span>No sufficient funds to enable transfer.</span>
    }

    const { transferTokens } = this.state

    return (
      <>
        <input
          type="text"
          onChange={this.setTransferTokens}
          value={transferTokens}
        />
        <button
          disabled={!transferTokens || !isFinite(Number(transferTokens))}
          onClick={this.showContactsModal}
        >
          Transfer
        </button>
        <SelectContactsModal
          ref={el => {
            this.selectContactsModal = el
          }}
          header={
            <span>
              Select receiver for{' '}
              <span className="kilt-token">{transferTokens}</span>
            </span>
          }
          placeholder="Select receiver…"
          isMulti={false}
          onCancel={this.cancelSelectContacts}
          onConfirm={this.finishSelectContacts}
        />
      </>
    )
  }

  private showContactsModal() {
    if (this.selectContactsModal) {
      this.selectContactsModal.show()
    }
  }

  private hideContactsModal() {
    if (this.selectContactsModal) {
      this.selectContactsModal.hide()
    }
  }

  private cancelSelectContacts() {
    this.hideContactsModal()
    this.setState({ transferTokens: '' })
  }

  private finishSelectContacts() {
    this.hideContactsModal()
    this.transferTokens()
  }

  private setTransferTokens(event: ChangeEvent<HTMLInputElement>) {
    const { value: amount } = event.target
    const myBalance = this.getMyBalance()

    if (!myBalance) {
      return
    }

    const amountNumber = Number(amount)

    if (
      amount === '' ||
      (isFinite(amountNumber) &&
        amountNumber > 0 &&
        myBalance - amountNumber >= 0)
    ) {
      this.setState({ transferTokens: '' + amount })
    }
  }

  private transferTokens() {
    const { transferTokens } = this.state
    console.log('transfering', transferTokens, ' Tokens')
    this.setState({ transferTokens: '' })
  }
}

const mapStateToProps = (state: ReduxState) => {
  return {
    balances: Balances.getBalances(state),
  }
}

export default connect(mapStateToProps)(Balance)
