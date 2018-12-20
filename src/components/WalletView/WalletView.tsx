import * as mnemonic from '@polkadot/util-crypto/mnemonic'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'
import ContactRepository from '../../services/ContactRepository'

import * as Wallet from '../../state/ducks/Wallet'
import IdentityViewComponent from '../IdentityView/IdentityView'
import { Identity } from '@kiltprotocol/prototype-sdk'
import { u8aToHex } from '@polkadot/util'

type Props = RouteComponentProps<{}> & {
  saveIdentity: (alias: string, identity: Identity) => void
  removeIdentity: (seedAsHex: string) => void
  identities: Wallet.Entry[]
}
type State = {
  randomPhrase: string
  alias: string
}

class WalletView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      alias: '',
      randomPhrase: mnemonic.mnemonicGenerate(),
    }
  }

  public render() {
    const identities = this.props.identities.map((entry: Wallet.Entry) => (
      <IdentityViewComponent
        key={entry.identity.seedAsHex}
        identity={entry.identity}
        alias={entry.alias}
        onDelete={this.removeIdentity}
      />
    ))

    return (
      <section className="WalletView">
        <h1>Wallet / My Identities</h1>
        <hr />
        <h3>Add new identity from phrase</h3>
        <h4>(duplicates not permitted)</h4>
        <input
          type="text"
          value={this.state.randomPhrase}
          onChange={this.setRandomPhrase}
        />
        <button onClick={this.createRandomPhrase}>create random phrase</button>
        <br />
        <input
          type="text"
          placeholder="Name"
          value={this.state.alias}
          onChange={this.setAlias}
        />
        <button onClick={this.addIdentity}>Add</button>
        <hr />
        {identities}
      </section>
    )
  }

  private addIdentity = () => {
    const identity: Identity = Identity.buildFromMnemonic(
      this.state.randomPhrase
    )
    ContactRepository.add({
      encryptionKey: u8aToHex(identity.boxKeyPair.publicKey),
      key: u8aToHex(identity.signKeyPair.publicKey),
      name: this.state.alias,
    }).then(
      () => {
        this.props.saveIdentity(this.state.alias, identity)
        this.createRandomPhrase()
      },
      error => {
        console.error('failed to POST new identity', error)
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

  private removeIdentity = (seedAsHex: string) => {
    this.props.removeIdentity(seedAsHex)
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    identities: state.wallet
      .get('identities')
      .toList()
      .toArray(),
  }
}

const mapDispatchToProps = (dispatch: (action: Wallet.Action) => void) => {
  return {
    removeIdentity: (seedAsHex: string) => {
      dispatch(Wallet.Store.removeIdentityAction(seedAsHex))
    },
    saveIdentity: (alias: string, identity: Identity) => {
      dispatch(Wallet.Store.saveIdentityAction(alias, identity))
    },
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(WalletView)
)
