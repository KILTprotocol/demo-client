import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
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
import { ICTypeWithMetadata } from '../../types/Ctype'
import { BlockUi } from '../../types/UserFeedback'
import './CtypeCreate.scss'
import { fromInputModel } from '../../utils/CtypeUtils'

type StateProps = {
  selectedIdentity?: Wallet.Entry
}

type Props = RouteComponentProps & StateProps

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

  public componentDidMount(): void {
    this.connect()
  }

  private updateCType = (cType: string, isValid: boolean): void => {
    this.setState({
      cType,
      isValid,
    })
  }

  public connect(): void {
    // TODO: test unmount and host change
    // TODO: test error handling
    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Connecting to block chain',
    })
    this.setState({ connected: true })
    blockUi.remove()
  }

  private cancel(): void {
    const { history } = this.props
    // TODO: goto CTYPE list or previous screen?
    history.push('/cType')
  }

  public submit(): void {
    const { selectedIdentity, history } = this.props
    const { connected, isValid, cType: stateCtype } = this.state
    stateCtype.owner = selectedIdentity?.identity.address
    if (selectedIdentity && connected && isValid) {
      let cType: sdk.CType
      let metaData: sdk.ICTypeMetadata
      try {
        const inputICTypeWithMetadata = fromInputModel(stateCtype)
        ;({ cType, metaData } = inputICTypeWithMetadata)
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
      const cTypeWrapper: ICTypeWithMetadata = {
        cType: {
          schema: cType.schema,
          owner: cType.owner,
          hash: cType.hash,
        },
        metaData,
      }

      cType
        .store(selectedIdentity.identity)
        .then(() => {
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
        })
        .then(() => {
          return CTypeRepository.register(cTypeWrapper)
            .then(() => {
              blockUi.remove()
              notifySuccess(
                `CTYPE ${metaData.metadata.title.default} successfully created.`
              ) // something better?
              history.push('/cType')
            })
            .catch(error => {
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

  public render(): JSX.Element {
    const { cType, connected, isValid } = this.state
    return (
      <section className="CTypeCreate">
        <h1 className="App-title">Create CTYPE</h1>
        <CTypeEditor
          cType={cType}
          updateCType={this.updateCType}
          submit={this.submit}
          cancel={this.cancel}
          connected={connected}
          isValid={isValid}
        />
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(withRouter(CTypeCreate))
