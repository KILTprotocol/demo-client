import { Identity } from '@kiltprotocol/sdk-js'
import * as mnemonic from '@polkadot/util-crypto/mnemonic'
import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'

import Input from '../../components/Input/Input'
import { BalanceUtilities } from '../../services/BalanceUtilities'
import ContactRepository from '../../services/ContactRepository'
import errorService from '../../services/ErrorService'
import { notify, notifySuccess } from '../../services/FeedbackService'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore from '../../state/PersistentStore'
import { IMyIdentity } from '../../types/Contact'

import './WalletAdd.scss'

type DispatchProps = {
  saveIdentity: (myIdentity: IMyIdentity) => void
}

type Props = DispatchProps & RouteComponentProps<{}>

type State = {
  alias: string
  pendingAdd: boolean
  randomPhrase: string
  useMyPhrase: boolean
  myPhrase: string
}

class WalletAdd extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      alias: '',
      myPhrase: '',
      pendingAdd: false,
      randomPhrase: mnemonic.mnemonicGenerate(),
      useMyPhrase: false,
    }
    this.togglePhrase = this.togglePhrase.bind(this)
    this.addIdentity = this.addIdentity.bind(this)
  }

  private setMyPhrase = (e: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({ myPhrase: e.currentTarget.value })
  }

  private setAlias = (e: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({ alias: e.currentTarget.value })
  }

  private createRandomPhrase = (): void => {
    this.setState({ randomPhrase: mnemonic.mnemonicGenerate() })
  }

  private togglePhrase(): void {
    const { useMyPhrase } = this.state
    this.setState({
      useMyPhrase: !useMyPhrase,
    })
  }

  private addIdentity(): void {
    const { alias, myPhrase, randomPhrase, useMyPhrase } = this.state
    const { history, saveIdentity } = this.props

    let identity: Identity
    const phrase = useMyPhrase ? myPhrase : randomPhrase
    try {
      identity = Identity.buildFromMnemonic(phrase)
    } catch (error) {
      errorService.log({
        error,
        message: `failed to create identity from phrase '${phrase}'`,
        origin: 'WalletAdd.addIdentity()',
      })
      return
    }

    notify(`Creation of identity '${alias}' initiated.`)
    history.push('/wallet')

    const newIdentity: IMyIdentity = {
      identity,
      metaData: {
        name: alias,
      },
      phrase,
    }
    saveIdentity(newIdentity)
    PersistentStore.store.dispatch(
      Contacts.Store.addContact(
        ContactRepository.getContactFromIdentity(newIdentity, {
          unregistered: true,
        })
      )
    )
    BalanceUtilities.connect(newIdentity)
    notifySuccess(`New identity '${alias}' successfully created`)
  }

  public render(): JSX.Element {
    const {
      alias,
      randomPhrase,
      pendingAdd,
      useMyPhrase,
      myPhrase,
    } = this.state
    return (
      <section className="WalletAdd">
        <h1>Create ID</h1>

        <div className="inputs">
          <div className="name">
            <label>Name your ID</label>
            <div>
              <Input
                type="text"
                value={alias}
                autoFocus
                onChange={this.setAlias}
                onSubmit={this.addIdentity}
              />
            </div>
          </div>

          {!useMyPhrase && (
            <div className="phrase">
              <div>
                <label>Seed Phrase</label>
                <button
                  type="button"
                  onClick={this.createRandomPhrase}
                  title="Create random phrase"
                />
              </div>
              <div>{randomPhrase}</div>
            </div>
          )}

          {useMyPhrase && (
            <div className="phrase">
              <label>Seed Phrase</label>
              <div>
                <input
                  type="text"
                  value={myPhrase}
                  onChange={this.setMyPhrase}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className={`toggle-phrase ${useMyPhrase ? 'checked' : ''}`}
          onClick={this.togglePhrase}
        >
          Import Seed Phrase
        </div>

        <div className="actions">
          <Link className="cancel" to="/wallet">
            Cancel
          </Link>
          <button
            type="button"
            className="add"
            onClick={this.addIdentity}
            disabled={
              (useMyPhrase && !myPhrase) ||
              (!useMyPhrase && !randomPhrase) ||
              !alias ||
              pendingAdd
            }
          >
            Add
          </button>
        </div>
      </section>
    )
  }
}

const mapDispatchToProps: DispatchProps = {
  saveIdentity: (myIdentity: IMyIdentity) =>
    Wallet.Store.saveIdentityAction(myIdentity),
}

export default withRouter(connect(null, mapDispatchToProps)(WalletAdd))
