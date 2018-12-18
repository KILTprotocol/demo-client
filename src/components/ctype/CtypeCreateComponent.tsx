import { ApiPromise } from '@polkadot/api'
import * as React from 'react'

import pair from '@polkadot/keyring/pair'
import { stringToU8a, u8aToHex } from '@polkadot/util'
import { keccakAsU8a, naclKeypairFromSeed } from '@polkadot/util-crypto'

import blockchainService from '../../services/BlockchainService'
import ctypeRepository from '../../services/CtypeRepository'
import { CType } from '../../types/Ctype'
import CtypeEditorComponent from './CtypeEditorComponent'

type Props = {}

type State = {
  connected: boolean
  schema: string
  name: string
}

class CtypeCreateComponent extends React.Component<Props, State> {
  private api: ApiPromise

  constructor(props: Props) {
    super(props)

    this.state = {
      connected: false,
      name: '',
      schema: '{ "title": "My New Schema" }',
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

    const { name, schema } = this.state
    const hash = keccakAsU8a(schema)

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
          const ctype: CType = {
            // TODO: use selected user
            author: 'Alice',
            key: u8aToHex(hash),
            name,
          }
          ctypeRepository.register(ctype).then(() => {
            // TODO go back
          })
        })
    }
  }

  public render() {
    return (
      <div>
        <h1 className="App-title">Ctype Manager</h1>
        <input
          type="text"
          onChange={this.updateName}
          placeholder="Name"
          value={this.state.name}
        />
        <CtypeEditorComponent
          schema={this.state.schema}
          updateSchema={this.updateSchema}
        />
        <br />
        <button
          disabled={this.state.connected ? false : true}
          onClick={this.submit}
        >
          Submit
        </button>
      </div>
    )
  }

  private updateSchema = (schema: string) => {
    this.setState({
      schema,
    })
  }
  private updateName = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      name: e.target.value,
    })
  }
}

export default CtypeCreateComponent
