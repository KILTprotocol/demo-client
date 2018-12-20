import { ApiPromise } from '@polkadot/api'
import * as React from 'react'

import pair from '@polkadot/keyring/pair'
import { stringToU8a, u8aToHex } from '@polkadot/util'
import { keccakAsU8a, naclKeypairFromSeed } from '@polkadot/util-crypto'

import blockchainService from '../../services/BlockchainService'
import ctypeRepository from '../../services/CtypeRepository'
import { CType } from '../../types/Ctype'
import CtypeEditor from '../CtypeEditor/CtypeEditor'

import '../CtypeManager/CtypeManager.scss'

type Props = {}

type State = {
  name: string
  connected: boolean
  ctype: any
}

class CtypeCreate extends React.Component<Props, State> {
  private api: ApiPromise

  constructor(props: Props) {
    super(props)

    this.state = {
      connected: false,
      ctype: { title: 'My New CType' },
      name: '',
    }

    this.submit = this.submit.bind(this)
  }

  public componentDidMount() {
    this.connect()
  }

  public async connect() {
    // TODO: test unmount and host change
    // TODO: test error handling
    this.api = await blockchainService.connect()
    this.setState({ connected: true })
  }

  public async submit() {
    // TODO: use selected user
    const seedAlice = 'Alice'.padEnd(32, ' ')
    const { secretKey, publicKey } = naclKeypairFromSeed(stringToU8a(seedAlice))
    const Alice = pair({ publicKey, secretKey })

    console.log('this.state', this.state)

    const { name, ctype } = this.state
    const hash = keccakAsU8a(JSON.stringify(ctype))

    const signature = Alice.sign(hash)
    console.log(`Signature: ${u8aToHex(signature)}`)

    const ctypeAdd = this.api.tx.ctype.add(hash, signature)

    const nonce = await this.api.query.system.accountNonce(Alice.address())
    if (nonce) {
      const signed = ctypeAdd.sign(Alice, nonce.toHex())
      signed
        .send((status: any) => {
          console.log(`current status ${status.type}`)
          console.log(status)
        })
        .then((_hash: any) => {
          console.log(`submitted with hash ${_hash}`)
          const _ctype: CType = {
            // TODO: use selected user
            author: 'Alice',
            // TODO add ctype
            definition: JSON.stringify(ctype),
            key: u8aToHex(hash),
            name,
          }
          ctypeRepository.register(_ctype).then(() => {
            // TODO go back
          })
        })
    }
  }

  public render() {
    return (
      <section className="CtypeCreate">
        <h1 className="App-title">Create CTYPE</h1>
        <input
          type="text"
          onChange={this.updateName}
          placeholder="Name"
          value={this.state.name}
        />
        <CtypeEditor
          ctype={this.state.ctype}
          updateCType={this.updateCType}
          submit={this.submit}
          connected={this.state.connected}
        />
      </section>
    )
  }

  private updateCType = (ctype: string) => {
    this.setState({
      ctype,
    })
  }
  private updateName = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      name: e.target.value,
    })
  }
}

export default CtypeCreate
