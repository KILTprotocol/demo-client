import * as sdk from '@kiltprotocol/sdk-js'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import CTypeEditor from '../../components/CtypeEditor/CtypeEditor'
import CTypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import FeedbackService, {
  notifyError,
  notifySuccess,
} from '../../services/FeedbackService'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { CTypeMetadata, CTypeMetadataChain } from '../../types/Ctype'
import { BlockUi } from '../../types/UserFeedback'
import './CtypeCreate.scss'
import { fromInputModel } from '../../utils/CtypeUtils'

type Props = RouteComponentProps<{}> & {
  selectedIdentity?: Wallet.Entry
}

type State = {
  connected: boolean
  cType: any
  isValid: boolean
}

class CTypeCreate extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      cType: { title: '' },
      connected: false,
      isValid: false,
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
      let cType : sdk.CType
      let metadata : sdk.ICTypeMetadata
      try {
       const inputCTypeWithMetadata: CTypeMetadataChain = fromInputModel(this.state.cType)
       cType = inputCTypeWithMetadata.cType
       metadata = inputCTypeWithMetadata.metaData
      } catch (error) {
        errorService.log({
          error,
          message: 'could not create CTYPE from Input Model',
          origin: 'CTypeCreate.submit()',
        })
        return
      }
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Creating CTYPE',
      })
      const cTypeWrapper: CTypeMetadata = {
        cType: {
          schema: cType.schema,
          owner: selectedIdentity.identity.address,
          hash: cType.hash,
        },
        metaData: metadata
      }
      cType
        .store(selectedIdentity.identity)
        .then((value: any) => {
          blockUi.updateMessage(
            `CTYPE stored on blockchain,\nnow registering CTYPE`
          ) // TODO: add onrejected when sdk provides error handling
        })
        .catch(error => {
          errorService.log({
            error,
            message: 'Could not submit CTYPE to the Blockchain',
            origin: 'CType.store()',
          })
          notifyError(error)
          blockUi.remove()
        }).then(() => {
          return CTypeRepository.register(cTypeWrapper).then(() => {
            blockUi.remove()
            notifySuccess(`CTYPE ${metadata.metadata.title.default} successfully created.`) // something better?
            history.push('/cType')
          }).catch(error => {
            errorService.log({
              error,
              message: 'Could not submit CTYPE to the Registry',
              origin: 'CTypeRepository.register()',
            })
            notifyError(error)
            blockUi.remove()
          })
        })
    }
  }

  public render() {
    return (
      <section className="CTypeCreate">
        <h1 className="App-title">Create CTYPE</h1>
        <CTypeEditor
          cType={this.state.cType}
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
    this.props.history.push('/cType')
  }

  private updateCType = (cType: string, isValid: boolean) => {
    this.setState({
      cType,
      isValid,
    })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(withRouter(CTypeCreate))
