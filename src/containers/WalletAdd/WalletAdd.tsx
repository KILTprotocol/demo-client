import { Blockchain, Identity } from '@kiltprotocol/prototype-sdk'
import * as mnemonic from '@polkadot/util-crypto/mnemonic'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'

import Input from '../../components/Input/Input'
import ContactRepository from '../../services/ContactRepository'
import errorService from '../../services/ErrorService'
import { notify, notifySuccess } from '../../services/FeedbackService'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'

import './WalletAdd.scss'

type Props = RouteComponentProps<{}> & {
  saveIdentity: (myIdentity: MyIdentity) => void
}
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

  public render() {
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
                value={this.state.alias}
                autoFocus={true}
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

  private togglePhrase() {
    const { useMyPhrase } = this.state
    this.setState({
      useMyPhrase: !useMyPhrase,
    })
  }

  private async addIdentity() {
    const { alias, myPhrase, randomPhrase, useMyPhrase } = this.state

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
    this.props.history.push('/wallet')

    const newIdentity: MyIdentity = {
      identity,
      metaData: {
        name: alias,
      },
      phrase,
    }
    this.props.saveIdentity(newIdentity)
    PersistentStore.store.dispatch(
      Contacts.Store.addContact(
        ContactRepository.getContactFromIdentity(newIdentity, {
          unregistered: true,
        })
      )
    )
    notifySuccess(`New identity '${alias}' successfully created`)
  }

  private createRandomPhrase = () => {
    this.setState({ randomPhrase: mnemonic.mnemonicGenerate() })
  }

  private setMyPhrase = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ myPhrase: e.currentTarget.value })
  }

  private setAlias = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ alias: e.currentTarget.value })
  }
}

const mapDispatchToProps = (dispatch: (action: Wallet.Action) => void) => {
  return {
    saveIdentity: (myIdentity: MyIdentity) => {
      dispatch(Wallet.Store.saveIdentityAction(myIdentity))
    },
  }
}

export default withRouter(
  connect(
    null,
    mapDispatchToProps
  )(WalletAdd)
)
