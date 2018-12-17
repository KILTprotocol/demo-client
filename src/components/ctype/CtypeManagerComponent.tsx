import pair from '@polkadot/keyring/pair'
import { stringToU8a, u8aToHex } from '@polkadot/util'
import { keccakAsU8a, naclKeypairFromSeed } from '@polkadot/util-crypto'
import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'

import If from '../../common/If'
import blockchainService from '../../services/BlockchainService'
import ctypeRepository from '../../services/CtypeRepository'
import { CType } from '../../types/Ctype'
import CtypeEditorComponent from './CtypeEditorComponent'
import './cTypeManager.scss'
import CtypeViewComponent from './CtypeViewComponent'

type Props = RouteComponentProps<{
  ctypeKey?: string
}>

type State = {
  name: string
  connected: boolean
  ctypes: CType[]
  ctype: any
}

class CtypeManagerComponent extends React.Component<Props, State> {
  // @ts-ignore
  private api: ApiPromise

  constructor(props: Props) {
    super(props)

    this.state = {
      connected: false,
      name: '',
      ctype: { 'title': 'My New CType' },
      ctypes: [],
    }

    this.submit = this.submit.bind(this)
  }

  public componentDidMount() {
    void this.init()
    this.connect()
  }

  public async connect() {
    // TODO: test unmount and host change
    // TODO: test error handling
    this.api = await blockchainService.connect()
    this.setState({ connected: true })
    // @ts-ignore
    window.api = this.api
  }

  public async submit() {
    // TODO: use selected user
    const seedAlice = 'Alice'.padEnd(32, ' ')
    const { secretKey, publicKey } = naclKeypairFromSeed(stringToU8a(seedAlice))
    const Alice = pair({ publicKey, secretKey })

    const { name, ctype } = this.state
    const hash = keccakAsU8a(ctype)

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
            key: u8aToHex(hash),
            name,
            // TODO: use selected user
            author: 'Alice',
          }
          ctypeRepository.register(ctype).then(() => {
            this.init()
          })
        })
    }
  }

  public render() {
    const ctypeKey = this.props.match.params.ctypeKey

    const list = this.state.ctypes.map(ctype => (
      <li key={ctype.key}>
        <Link to={`/ctype/${ctype.key}`}>{ctype.key}</Link>
      </li>
    ))

    return (
      <section className="ctype-manager">
        <h1 className="App-title">Ctype Manager</h1>
        <input
          type="text"
          onChange={this.updateName}
          placeholder="Name"
          value={this.state.name}
        />
        <CtypeEditorComponent
          ctype={this.state.ctype}
          updateCType={this.updateCType}
          submit={this.submit}
          connected={this.state.connected}
        />
        <br />
        <If
          condition={!!ctypeKey}
          then={<CtypeViewComponent ctypeKey={ctypeKey as string} />}
          else={<ul>{list}</ul>}
        />
      </section>
    )
  }

  private async init() {
    const ctypes = await ctypeRepository.findAll()
    this.setState({ ctypes })
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

export default withRouter(CtypeManagerComponent)
