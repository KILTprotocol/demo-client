import { Blockchain, Identity } from '@kiltprotocol/prototype-sdk'
import * as mnemonic from '@polkadot/util-crypto/mnemonic'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'

import BlockchainService from '../../services/BlockchainService'
import ContactRepository from '../../services/ContactRepository'
import ErrorService from '../../services/ErrorService'
import * as Wallet from '../../state/ducks/Wallet'
import './WalletAdd.scss'

type Props = RouteComponentProps<{}> & {
  saveIdentity: (alias: string, identity: Identity) => void
}
type State = {
  alias: string
  pendingAdd: boolean
  randomPhrase: string
}

class WalletAdd extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      alias: '',
      pendingAdd: false,
      randomPhrase: mnemonic.mnemonicGenerate(),
    }
  }

  public render() {
    const { alias, randomPhrase, pendingAdd } = this.state
    return (
      <section className="WalletAdd">
        <h1>Add Identity</h1>
        <h3>Add new identity from phrase</h3>
        <h4>(duplicates not permitted)</h4>

        <div className="inputs">
          <div className="name">
            <label>Name</label>
            <div>
              <input
                type="text"
                value={this.state.alias}
                onChange={this.setAlias}
              />
            </div>
          </div>

          <div className="phrase">
            <label>Phrase</label>
            <div>
              <input
                type="text"
                value={randomPhrase}
                onChange={this.setRandomPhrase}
              />
              <button
                onClick={this.createRandomPhrase}
                title="Create random phrase"
              />
            </div>
          </div>

          <div className="actions">
            <button
              onClick={this.addIdentity}
              disabled={!randomPhrase || !alias || pendingAdd}
            >
              Add
            </button>
          </div>
        </div>
      </section>
    )
  }

  private addIdentity = async () => {
    this.setState({
      pendingAdd: true,
    })
    const identity: Identity = Identity.buildFromMnemonic(
      this.state.randomPhrase
    )

    const blockchain: Blockchain = await BlockchainService.connect()
    const alice = Identity.buildFromSeedString('Alice')
    blockchain
      .makeTransfer(alice, identity.signKeyringPair.address(), 1000)
      .then(
        () => {
          ContactRepository.add({
            encryptionKey: identity.boxPublicKeyAsHex,
            key: identity.signPublicKeyAsHex,
            name: this.state.alias,
          }).then(
            () => {
              this.props.saveIdentity(this.state.alias, identity)
              this.props.history.push('/wallet')
              this.setState({
                pendingAdd: false,
              })
            },
            error => {
              ErrorService.log(
                'fetch.POST',
                error,
                'failed to POST new identity'
              )
              this.setState({
                pendingAdd: false,
              })
            }
          )
        },
        error => {
          ErrorService.log(
            'fetch.POST',
            error,
            'failed to transfer initial tokens to identity'
          )
          this.setState({
            pendingAdd: false,
          })
        }
      )
  }

  private createRandomPhrase = () => {
    this.setState({ randomPhrase: mnemonic.mnemonicGenerate() })
  }

  private setRandomPhrase = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ randomPhrase: e.currentTarget.value })
  }

  private setAlias = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ alias: e.currentTarget.value })
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
