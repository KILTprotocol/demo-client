import Immutable from 'immutable'
import React, { ChangeEvent, ReactNode } from 'react'
import { connect } from 'react-redux'
import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import KiltToken from '../../components/KiltToken/KiltToken'
import { ModalType } from '../../components/Modal/Modal'
import SelectContacts from '../../components/SelectContacts/SelectContacts'
import Spinner from '../../components/Spinner/Spinner'
import {
  BalanceUtilities,
  TRANSACTION_FEE,
} from '../../services/BalanceUtilities'
import FeedbackService, { notifyFailure } from '../../services/FeedbackService'

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
  transfer: {
    amount: string // String so we can have empty input field
    toAddress: Contact['publicIdentity']['address']
    toContact?: Contact
  }
}

class Balance extends React.Component<Props, State> {
  private selectContacts: SelectContacts | null

  constructor(props: Props) {
    super(props)
    this.state = {
      transfer: {
        amount: '',
        toAddress: '',
      },
    }

    this.onEnterTransferTokens = this.onEnterTransferTokens.bind(this)
    this.onEnterTransferToAddress = this.onEnterTransferToAddress.bind(this)
    this.onSelectTransferToContact = this.onSelectTransferToContact.bind(this)

    this.identityCheck = this.identityCheck.bind(this)
  }

  public render() {
    const myBalance = this.getMyBalance()

    return (
      <section className="Balance">
        <section className="myBalance">
          <h2>My balance</h2>
          <div className="display">
            <label>Balance</label>
            {myBalance == null && (
              <Spinner size={20} color="#ef5a28" strength={3} />
            )}
            {myBalance != null && <KiltToken amount={myBalance} />}
          </div>
        </section>
        <section className="transfer-tokens">
          <h2>Transfer tokens</h2>
          {this.getTokenTransferElement(myBalance)}
        </section>
      </section>
    )
  }

  private getMyBalance(): number | undefined {
    const { balances, myIdentity } = this.props
    return balances.get(myIdentity.identity.address)
  }

  private getTokenTransferElement(balance: number | undefined): ReactNode {
    if (balance === undefined || balance < TRANSACTION_FEE) {
      return <div>Not available due to insufficient funds.</div>
    }

    const { transfer } = this.state
    const { amount, toAddress, toContact } = transfer

    return (
      <>
        <div className="transfer-amount">
          <label>Transfer amount</label>
          <div>
            <input
              type="text"
              onChange={this.onEnterTransferTokens}
              value={amount}
              placeholder="Whole numbers"
            />
            <KiltToken />
          </div>
        </div>
        <div className="enter-address">
          <label>Enter address</label>
          <input
            type="text"
            onChange={this.onEnterTransferToAddress}
            value={toAddress}
          />
        </div>
        <div>
          <label>or</label>
        </div>
        <div className="select-contact">
          <label>Select contact</label>
          <SelectContacts
            ref={el => {
              this.selectContacts = el
            }}
            name={name as string}
            isMulti={false}
            closeMenuOnSelect={true}
            onChange={this.onSelectTransferToContact}
          />
        </div>
        <div className="actions">
          <button
            disabled={
              !amount || !isFinite(Number(amount)) || (!toAddress && !toContact)
            }
            onClick={this.identityCheck}
          >
            Transfer
          </button>
        </div>
      </>
    )
  }

  private onSelectTransferToContact(selectedContacts: Contact[]) {
    const { transfer } = this.state

    this.setState({
      transfer: {
        ...transfer,
        toAddress: '',
        toContact: selectedContacts[0],
      },
    })
  }

  private onEnterTransferToAddress(event: ChangeEvent<HTMLInputElement>) {
    const { value: address } = event.target
    const { transfer } = this.state

    this.setState({
      transfer: {
        ...transfer,
        toAddress: address,
        toContact: undefined,
      },
    })
    this.resetContacts()
  }

  private onEnterTransferTokens(event: ChangeEvent<HTMLInputElement>) {
    const { transfer } = this.state
    const { value: amount } = event.target
    const myBalance = this.getMyBalance()

    if (!myBalance || amount.indexOf('.') !== -1) {
      return
    }

    const amountNumber = Number(amount)

    if (
      amount === '' ||
      (isFinite(amountNumber) &&
        amountNumber > 0 &&
        myBalance - amountNumber >= 0)
    ) {
      this.setState({
        transfer: {
          ...transfer,
          amount: '' + amount,
        },
      })
    }
  }

  private identityCheck() {
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
            <KiltToken />
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
          this.transferTokens()
          notification.remove()
        },
        type: NotificationType.INFO,
      })
    } else {
      this.transferTokens()
    }
  }

  private transferTokens() {
    const { myIdentity } = this.props
    const { transfer } = this.state
    const { amount, toAddress, toContact } = transfer

    const receiverAddress = toAddress
      ? toAddress
      : toContact
      ? toContact.publicIdentity.address
      : undefined

    if (!receiverAddress) {
      notifyFailure(`No receiver selected/entered.`)
      return
    }

    BalanceUtilities.makeTransfer(myIdentity, receiverAddress, Number(amount))
      .then(() => {
        this.setState({
          transfer: {
            amount: '',
            toAddress: '',
            toContact: undefined,
          },
        })
        this.resetContacts()
      })
      .catch(() => {
        // prevent clearing input/selects
      })
  }

  private resetContacts() {
    const { selectContacts } = this
    if (selectContacts) {
      selectContacts.reset()
    }
  }
}

const mapStateToProps = (state: ReduxState) => {
  return {
    balances: Balances.getBalances(state),
  }
}

export default connect(mapStateToProps)(Balance)
