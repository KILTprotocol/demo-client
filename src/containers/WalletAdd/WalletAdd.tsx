import { Blockchain, Identity } from '@kiltprotocol/prototype-sdk'
import * as mnemonic from '@polkadot/util-crypto/mnemonic'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'

import BlockchainService from '../../services/BlockchainService'
import ContactRepository from '../../services/ContactRepository'
import ErrorService from '../../services/ErrorService'
import FeedbackService from '../../services/FeedbackService'
import * as Wallet from '../../state/ducks/Wallet'
import { BlockUi } from '../../types/UserFeedback'
import './WalletAdd.scss'

type Props = RouteComponentProps<{}> & {
  saveIdentity: (alias: string, identity: Identity) => void
}
type State = {
  alias: string
  pendingAdd: boolean
  randomPhrase: string
  useMyPhrase: boolean
  myPhrase: string
}

class WalletAdd extends React.Component<Props, State> {
  private blockUi: BlockUi

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
              <input
                type="text"
                value={this.state.alias}
                onChange={this.setAlias}
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

    this.blockUi = FeedbackService.addBlockUi({
      headline: 'Creating identity',
      message: 'building Identity from phrase (1/3)',
    })

    let identity: Identity
    const usePhrase = useMyPhrase ? myPhrase : randomPhrase
    try {
      identity = Identity.buildFromMnemonic(usePhrase)
    } catch (error) {
      ErrorService.log({
        error,
        message: `failed to create identity from phrase '${usePhrase}'`,
        origin: 'WalletAdd.addIdentity()',
      })
      this.enableUi()
      return
    }

    const blockchain: Blockchain = await BlockchainService.connect()
    const alice = Identity.buildFromSeedString('Alice')
    this.blockUi.updateMessage('transfer initial tokens (2/3)')
    blockchain
      .makeTransfer(alice, identity.signKeyringPair.address(), 1000)
      .then(
        () => {
          this.blockUi.updateMessage(
            'adding identity to contact repository (3/3)'
          )
          ContactRepository.add({
            encryptionKey: identity.boxPublicKeyAsHex,
            key: identity.signPublicKeyAsHex,
            name: alias,
          }).then(
            () => {
              this.props.saveIdentity(alias, identity)
              this.props.history.push('/wallet')
              this.enableUi()
            },
            error => {
              ErrorService.log({
                error,
                message: 'failed to POST new identity',
                origin: 'WalletAdd.addIdentity()',
                type: 'ERROR.FETCH.POST',
              })
              this.enableUi()
            }
          )
        },
        error => {
          ErrorService.log({
            error,
            message: 'failed to transfer initial tokens to identity',
            origin: 'WalletAdd.addIdentity()',
          })
          this.enableUi()
        }
      )
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

  private enableUi() {
    this.blockUi.remove()
    delete this.blockUi
  }

  private disableUi(message: string) {
    this.blockUi = FeedbackService.addBlockUi({ headline: message })
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  // TODO: empty block causes tslint warning, check how to handle this
  return {}
}

const mapDispatchToProps = (dispatch: (action: Wallet.Action) => void) => {
  return {
    saveIdentity: (alias: string, identity: Identity) => {
      dispatch(Wallet.Store.saveIdentityAction(alias, identity))
    },
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(WalletAdd)
)
