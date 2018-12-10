import * as mnemonic from '@polkadot/util-crypto/mnemonic'
import values from 'lodash/values'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'

import {
  IWalletState,
  removeUser,
  saveUser,
  WalletAction,
} from '../../state/ducks/wallet'
import Identity from '../../types/Identity'
import IdentityViewComponent from './IdentityViewComponent'

type Props = RouteComponentProps<{}> & {
  saveUser: (alias: string, identity: Identity) => void
  removeUser: (seedAsHex: string) => void
  identities: { [key: string]: { alias: string; identity: Identity } }
}
type State = {
  randomPhrase: string
  alias: string
}

class WalletComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      alias: '',
      randomPhrase: mnemonic.mnemonicGenerate(),
    }
  }

  public render() {
    const identities = values(this.props.identities).map(
      ({ alias, identity }) => (
        <IdentityViewComponent
          key={identity.seedAsHex}
          identity={identity}
          alias={alias}
          onDelete={this.removeIdentity}
        />
      )
    )

    return (
      <div>
        <h1>Wallet</h1>
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
      </div>
    )
  }

  private addIdentity = () => {
    const identity = new Identity(this.state.randomPhrase)
    this.props.saveUser(this.state.alias, identity)
    this.createRandomPhrase()
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
    this.props.removeUser(seedAsHex)
  }
}

// types
const mapStateToProps = (state: { wallet: IWalletState }) => {
  return {
    identities: state.wallet,
  }
}

const mapDispatchToProps = (dispatch: (action: WalletAction) => void) => {
  return {
    removeUser: (seedAsHex: string) => {
      dispatch(removeUser(seedAsHex))
    },
    saveUser: (alias: string, identity: Identity) => {
      dispatch(saveUser(alias, identity))
    },
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(WalletComponent)
)
