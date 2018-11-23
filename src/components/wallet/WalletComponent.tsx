import * as mnemonic from '@polkadot/util-crypto/mnemonic'
import update from 'immutability-helper'
import values from 'lodash/values'
import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'
import Identity from '../../types/Identity'
import IdentityViewComponent from './IdentityViewComponent'


type Props = RouteComponentProps<{}>
type State = {
  identities: { [key: string]: Identity },
  randomPhrase: string
}

class WalletComponent extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      identities: {}, // TODO: load from localStorage
      randomPhrase: mnemonic.mnemonicGenerate()
    }
  }

  public render() {
    const identities = values(this.state.identities).map((identity: Identity) => <IdentityViewComponent key={identity.seedAsHex} identity={identity} onDelete={this.removeIdentity} />)

    return (
      <div>
        <h1>Wallet</h1>
        <hr />
        <input type='text' value={this.state.randomPhrase} onChange={this.setRandomPhrase} />
        <button onClick={this.createRandomPhrase}>create random phrase</button>
        <br />
        <button onClick={this.addIdentity}>Add new identity from phrase (duplicates not permitted)</button>
        <hr />
        {identities}
      </div>
    )
  }

  private addIdentity = () => {
    const identity = new Identity(this.state.randomPhrase)
    const newPartialState = {}
    newPartialState[identity.seedAsHex] = identity
    const newState = update(this.state.identities, { $merge: newPartialState })
    this.setState({ identities: newState })
    // TODO: add to localStorage
  }

  private createRandomPhrase = () => {
    this.setState({ randomPhrase: mnemonic.mnemonicGenerate() })
  }

  private setRandomPhrase = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ randomPhrase: e.currentTarget.value })
  }

  private removeIdentity = (seedAsHex: string) => {
    const newState = update(this.state.identities, { $unset: [seedAsHex] })
    this.setState({ identities: newState })
    // TODO: remove from localStorage
  }
}

export default withRouter(WalletComponent)
