import Immutable from 'immutable'
import React, { ChangeEvent, ReactNode } from 'react'
import { connect } from 'react-redux'
import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import { ModalType } from '../../components/Modal/Modal'
import SelectContactsModal from '../../components/Modal/SelectContactsModal'
import Spinner from '../../components/Spinner/Spinner'
import BalanceUtilities from '../../services/BalanceUtilities'
import FeedbackService from '../../services/FeedbackService'

import * as Balances from '../../state/ducks/Balances'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import {
  BlockingNotification,
  NotificationType,
} from '../../types/UserFeedback'

import './Balance.scss'

type Props = {
  balances: Immutable.Map<string, number>
  myIdentity: MyIdentity
}

type State = {
  transferTokens: string // String so we can have empty input field
}

class Balance extends React.Component<Props, State> {
  private selectContactsModal: SelectContactsModal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      transferTokens: '',
    }

    this.setTransferTokens = this.setTransferTokens.bind(this)
    this.checkTransferTokens = this.checkTransferTokens.bind(this)
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
    return balances.get(myIdentity.identity.address)
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

  private finishSelectContacts(receiver: Contact[]) {
    this.hideContactsModal()
    this.checkTransferTokens(receiver[0])
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

  private checkTransferTokens(receiver: Contact) {
    const { myIdentity } = this.props
    const selectedIdentity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    )

    // the identity of this component might not be the currently selected one
    // so we need to inform the user in this case
    if (myIdentity.identity.address !== selectedIdentity.identity.address) {
      FeedbackService.addBlockingNotification({
        header: `Attention!`,
        message: (
          <div>
            <span>You are trying so transfer </span>
            <span className="kilt-token" />
            <span> from your identity </span>
            <ContactPresentation
              address={myIdentity.identity.address}
              inline={true}
            />
            <span> which is not your currently active identity </span>
            <ContactPresentation
              address={selectedIdentity.identity.address}
              inline={true}
            />
          </div>
        ),
        modalType: ModalType.CONFIRM,
        onConfirm: (notification: BlockingNotification) => {
          this.transferTokens(receiver)
          notification.remove()
        },
        type: NotificationType.INFO,
      })
    } else {
      this.transferTokens(receiver)
    }
  }

  private transferTokens(receiver: Contact) {
    const { myIdentity } = this.props
    const { transferTokens } = this.state

    this.setState({ transferTokens: '' })

    BalanceUtilities.makeTransfer(
      myIdentity,
      receiver.publicIdentity.address,
      Number(transferTokens)
    )
  }
}

const mapStateToProps = (state: ReduxState) => {
  return {
    balances: Balances.getBalances(state),
  }
}

export default connect(mapStateToProps)(Balance)
