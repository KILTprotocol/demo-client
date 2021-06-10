import { Identity } from '@kiltprotocol/sdk-js'
import * as mnemonic from '@polkadot/util-crypto/mnemonic'
import { KeypairType } from '@polkadot/util-crypto/types'
import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import Select from 'react-select'
import DidService from '../../services/DidService'
import Input from '../../components/Input/Input'
import { BalanceUtilities } from '../../services/BalanceUtilities'
import ContactRepository from '../../services/ContactRepository'
import errorService from '../../services/ErrorService'
import { notify, notifySuccess } from '../../services/FeedbackService'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import { persistentStoreInstance } from '../../state/PersistentStore'
import { IContact, IMyIdentity } from '../../types/Contact'

import './WalletAdd.scss'
import { ValueType } from 'react-select/lib/types'

type OptionsKeyPairType = {
  label: string
  value: KeypairType
}

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
  mySigningKeyPairType: OptionsKeyPairType
  advancedOptions: boolean
}

const keypairTypeOptions: OptionsKeyPairType[] = [
  { value: 'sr25519', label: 'SR25519' },
  { value: 'ed25519', label: 'ED25519' },
]

class WalletAdd extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      alias: '',
      myPhrase: '',
      mySigningKeyPairType: keypairTypeOptions[0],
      pendingAdd: false,
      randomPhrase: mnemonic.mnemonicGenerate(),
      useMyPhrase: false,
      advancedOptions: false,
    }
    this.togglePhrase = this.togglePhrase.bind(this)
    this.toggleAdvancedOptions = this.toggleAdvancedOptions.bind(this)
    this.addIdentity = this.addIdentity.bind(this)
  }

  private setMyPhrase = (e: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({ myPhrase: e.currentTarget.value })
  }

  private setMySigningKeyPairType = (
    selectedKeyPairType: ValueType<OptionsKeyPairType>
  ): void => {
    if (!selectedKeyPairType) return
    this.setState({
      mySigningKeyPairType: (selectedKeyPairType  as OptionsKeyPairType),
    })
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

  private toggleAdvancedOptions(): void {
    const { advancedOptions } = this.state
    this.setState({
      advancedOptions: !advancedOptions,
    })
  }

  private async addIdentity(): Promise<void> {
    const {
      alias,
      myPhrase,
      randomPhrase,
      useMyPhrase,
      mySigningKeyPairType,
    } = this.state
    const { history, saveIdentity } = this.props

    let identity
    const phrase = useMyPhrase ? myPhrase : randomPhrase
    try {
      identity = Identity.buildFromMnemonic(phrase, {
        signingKeyPairType: mySigningKeyPairType.value,
      })
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
      keypairType: mySigningKeyPairType.value,
      metaData: {
        name: alias,
      },
      phrase,
    }

    const didDocument = await DidService.fetchDID(identity)

    if (didDocument) {
      const did: IContact['did'] = {
        identifier: didDocument.id,
        document: didDocument,
      }
      newIdentity.did = did
    }

    saveIdentity(newIdentity)
    persistentStoreInstance.store.dispatch(
      Contacts.Store.addContact(
        ContactRepository.getContactFromIdentity(newIdentity, {
          unregistered: true,
          addedAt: Date.now(),
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
      advancedOptions,
      mySigningKeyPairType,
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
          <button type="button" onClick={this.toggleAdvancedOptions}>
            Advanced Options
          </button>
        </div>

        {advancedOptions && (
          <div className="key-pair-type">
            <label>Signing Key Pair</label>
            <div>
              <Select
                options={keypairTypeOptions}
                value={mySigningKeyPairType}
                isMulti={false}
                onChange={this.setMySigningKeyPairType}
              />
            </div>
          </div>
        )}

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
