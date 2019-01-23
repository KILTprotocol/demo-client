import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'

import CtypeEditor from '../../components/CtypeEditor/CtypeEditor'
import BlockchainService from '../../services/BlockchainService'
import ctypeRepository from '../../services/CtypeRepository'
import ErrorService from '../../services/ErrorService'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import * as Wallet from '../../state/ducks/Wallet'
import { CType } from '../../types/Ctype'
import { BlockUi } from '../../types/UserFeedback'

import './CtypeCreate.scss'

type Props = RouteComponentProps<{}> & {
  selectedIdentity?: Wallet.Entry
}

type State = {
  connected: boolean
  ctype: any
  isValid: boolean
  name: string
}

class CtypeCreate extends React.Component<Props, State> {
  private blockchain: sdk.Blockchain

  constructor(props: Props) {
    super(props)

    this.state = {
      connected: false,
      ctype: { title: 'My New CType' },
      isValid: false,
      name: '',
    }

    this.submit = this.submit.bind(this)
    this.cancel = this.cancel.bind(this)
  }

  public componentDidMount() {
    this.connect()
  }

  public async connect() {
    // TODO: test unmount and host change
    // TODO: test error handling
    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Connecting to block chain',
    })
    this.blockchain = await BlockchainService.connect()
    this.setState({ connected: true })
    blockUi.remove()
  }

  public async submit() {
    if (
      this.props.selectedIdentity &&
      this.state.connected &&
      this.state.isValid
    ) {
      const { selectedIdentity, history } = this.props
      const authorAlias: string = selectedIdentity.alias
      let ctype: sdk.CType

      try {
        ctype = sdk.CType.fromInputModel(this.state.ctype)
      } catch (error) {
        ErrorService.log({
          error,
          message: 'could not create CTYPE from Input Model',
          origin: 'CtypeCreate.submit()',
        })
        return
      }

      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Creating CTYPE',
        message: 'submitting CTYPE (1/3)',
      })

      ctype
        .store(this.blockchain, selectedIdentity.identity, () => {
          blockUi.updateMessage(
            `CTYPE stored on block chain,\nnow registering CTYPE (3/3)`
          )
          const ctypeWrapper: CType = {
            author: authorAlias,
            definition: JSON.stringify(ctype.getModel()),
            key: ctype.getModel().hash,
            name: this.state.name,
          }
          // TODO: add onrejected when sdk provides error handling
          ctypeRepository.register(ctypeWrapper).then(() => {
            blockUi.remove()
            notifySuccess(`CTYPE ${ctypeWrapper.name} successfully created.`)
            history.push('/ctype')
          })
        })
        .then((_hash: any) => {
          blockUi.updateMessage(
            `CTYPE submitted with hash ${_hash},\nnow storing on block chain (2/3)`
          )
        })
        .catch(error => {
          ErrorService.log({
            error,
            message: 'could not submit CTYPE',
            origin: 'CtypeCreate.submit()',
          })
          blockUi.remove()
        })
    }
  }

  public render() {
    return (
      <section className="CtypeCreate">
        <h1 className="App-title">Create CTYPE</h1>
        <div className="Ctype-name">
          <label>Name</label>
          <input
            type="text"
            onChange={this.updateName}
            value={this.state.name}
          />
        </div>
        <CtypeEditor
          ctype={this.state.ctype}
          updateCType={this.updateCType}
          submit={this.submit}
          cancel={this.cancel}
          connected={this.state.connected}
          isValid={this.state.isValid}
        />
      </section>
    )
  }

  private cancel() {
    // TODO: goto CTYPE list or previous screen?
    this.props.history.push('/ctype')
  }

  private updateCType = (ctype: string, isValid: boolean) => {
    this.setState({
      ctype,
      isValid,
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

export default connect(mapStateToProps)(withRouter(CtypeCreate))
