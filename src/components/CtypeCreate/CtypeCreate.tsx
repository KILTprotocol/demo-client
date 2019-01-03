import * as React from 'react'

import ctypeRepository from '../../services/CtypeRepository'
import * as CTypeModel from '../../types/Ctype'
import CtypeEditor from '../CtypeEditor/CtypeEditor'

import '../CtypeManager/CtypeManager.scss'
import { Blockchain, CType } from '@kiltprotocol/prototype-sdk'
import * as Wallet from '../../state/ducks/Wallet'
import { connect } from 'react-redux'
import BlockchainService from '../../services/BlockchainService'

type Props = {
  selectedIdentity?: Wallet.Entry
}

type State = {
  name: string
  connected: boolean
  ctype: any
}

class CtypeCreate extends React.Component<Props, State> {
  private blockchain: Blockchain

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
    this.blockchain = await BlockchainService.connect()
    this.setState({ connected: true })
  }

  public async submit() {
    if (this.props.selectedIdentity) {
      const _author: string = this.props.selectedIdentity.alias
      const ctype = CType.fromInputModel(this.state.ctype)
      ctype
        .store(this.blockchain, this.props.selectedIdentity.identity, () => {
          console.log('finalized ctype registration')
          const _ctype: CTypeModel.CType = {
            author: _author,
            definition: JSON.stringify(ctype.getModel()),
            key: ctype.getModel().hash,
            name: this.state.name,
          }
          ctypeRepository.register(_ctype).then(() => {
            // TODO go back
          })
        })
        .then((_hash: any) => {
          console.log('submitted with hash ' + _hash)
        })
        .catch(() => {
          // TODO: error handling?
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

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    selectedIdentity: state.wallet.get('selected'),
  }
}

export default connect(mapStateToProps)(CtypeCreate)
