import * as mnemonic from '@polkadot/util-crypto/mnemonic'
import * as nacl from '@polkadot/util-crypto/nacl'
import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'

type Props = RouteComponentProps<{}>

class WalletComponent extends React.Component<Props, {}> {

  constructor(props: Props) {
    super(props)
  }

  public render() {
    return (
      <div>
        <h1>Wallet</h1>
        <hr />
        <button onClick={this.createNewKeyPair}>Add new identity</button>
      </div>
    )
  }

  private createNewKeyPair = () => {
    const phrase = mnemonic.mnemonicGenerate()
    const isValid = mnemonic.mnemonicValidate(phrase)
    const seed = mnemonic.mnemonicToSeed(phrase)
    console.log(phrase, isValid, seed)

    const keyPair = nacl.naclKeypairFromSeed(seed)
    console.log(keyPair)
  }
}

export default withRouter(WalletComponent)
