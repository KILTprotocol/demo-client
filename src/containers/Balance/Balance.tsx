import Immutable from 'immutable'
import React, { ChangeEvent, ReactNode } from 'react'
import BN from 'bn.js'
import { connect, MapStateToProps } from 'react-redux'
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
import { IContact, IMyIdentity } from '../../types/Contact'
import {
  IBlockingNotification,
  NotificationType,
} from '../../types/UserFeedback'

import './Balance.scss'

type StateProps = {
  balances: Immutable.Map<string, BN>
}

type OwnProps = {
  myIdentity: IMyIdentity
}

type Props = StateProps & OwnProps

type State = {
  transfer: {
    amount: string // String so we can have empty input field
    toAddress: IContact['publicIdentity']['address']
    toContact?: IContact
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

  private onSelectTransferToContact(selectedContacts: IContact[]): void {
    const { transfer } = this.state

    this.setState({
      transfer: {
        ...transfer,
        toAddress: '',
        toContact: selectedContacts[0],
      },
    })
  }

  private onEnterTransferToAddress(event: ChangeEvent<HTMLInputElement>): void {
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

  private onEnterTransferTokens(event: ChangeEvent<HTMLInputElement>): void {
    const { transfer } = this.state
    const { value: amount } = event.target
    const myBalance = this.getMyBalance()

    if (!myBalance || amount.includes('.')) {
      return
    }

    const amountNumber = new BN(amount)

    if (amount === '' || (amountNumber.gtn(0) && amountNumber.lte(myBalance))) {
      this.setState({
        transfer: {
          ...transfer,
          amount: `${amount}`,
        },
      })
    }
  }

  private getMyBalance(): BN | undefined {
    const { balances, myIdentity } = this.props
    return balances.get(myIdentity.identity.address)
  }

  private getTokenTransferElement(balance: BN | undefined): ReactNode {
    if (balance === undefined || balance.lt(TRANSACTION_FEE)) {
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
              type="number"
              onChange={this.onEnterTransferTokens}
              value={amount}
              placeholder="Whole KILT tokens"
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
            isMulti={false}
            closeMenuOnSelect
            onChange={this.onSelectTransferToContact}
          />
        </div>
        <div className="actions">
          <button
            type="button"
            disabled={
              !amount ||
              !Number.isFinite(Number(amount)) ||
              (!toAddress && !toContact)
            }
            onClick={this.identityCheck}
          >
            Transfer
          </button>
        </div>
      </>
    )
  }

  private identityCheck(): void {
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
            <ContactPresentation address={myIdentity.identity.address} inline />
            <span> which is not your currently active identity </span>
            <ContactPresentation
              address={selectedIdentity.identity.address}
              inline
            />
          </div>
        ),
        modalType: ModalType.CONFIRM,
        onConfirm: (notification: IBlockingNotification) => {
          this.transferTokens()
          notification.remove()
        },
        type: NotificationType.INFO,
      })
    } else {
      this.transferTokens()
    }
  }

  private transferTokens(): void {
    const { myIdentity } = this.props
    const { transfer } = this.state
    const { amount, toAddress, toContact } = transfer

    const receiverAddress =
      toAddress || (toContact ? toContact.publicIdentity.address : undefined)

    if (!receiverAddress) {
      notifyFailure(`No receiver selected/entered.`)
      return
    }

    BalanceUtilities.makeTransfer(myIdentity, receiverAddress, Number(amount))
    this.setState({
      transfer: {
        amount: '',
        toAddress: '',
        toContact: undefined,
      },
    })
    this.resetContacts()
  }

  private resetContacts(): void {
    const { selectContacts } = this
    if (selectContacts) {
      selectContacts.reset()
    }
  }

  public render(): JSX.Element {
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
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => {
  return {
    balances: Balances.getBalances(state),
  }
}

export default connect(mapStateToProps)(Balance)
