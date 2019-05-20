import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import * as common from 'schema-based-json-editor'
import PlainSchemaEditor from '../../components/PlainSchemaEditor/PlainSchemaEditor'

import SchemaEditor from '../../components/SchemaEditor/SchemaEditor'
import CTypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import FeedbackService, {
  notifyError,
  notifySuccess,
} from '../../services/FeedbackService'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { ICType } from '../../types/Ctype'
import { BlockUi } from '../../types/UserFeedback'

import './CtypeCreate.scss'

type Props = RouteComponentProps<{}> & {
  selectedIdentity?: Wallet.Entry
}

type State = {
  isValid: boolean

  cType?: Partial<sdk.ICType>
}

class CTypeCreate extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      isValid: false,
    }

    this.submit = this.submit.bind(this)
    this.cancel = this.cancel.bind(this)
  }

  public render() {
    return (
      <section className="CTypeCreate">
        <h1 className="App-title">Create CTYPE</h1>
        <SchemaEditor
          schema={sdk.CTypeInputModel as common.Schema}
          initialValue={{}}
          onUpdateSchema={this.onUpdateSchemaBySchemaEditor}
        />
        <PlainSchemaEditor
          schema={JSON.stringify(sdk.CTypeInputModel)}
          onUpdateSchema={this.onUpdateSchemaByPlainSchemaEditor}
        />

        {/*<CTypeEditor*/}
        {/*cType={this.state.cType}*/}
        {/*onUpdateCType={this.updateCType}*/}
        {/*onSubmit={this.submit}*/}
        {/*onCancel={this.cancel}*/}
        {/*connected={this.state.connected}*/}
        {/*isValid={this.state.isValid}*/}
        {/*/>*/}
      </section>
    )
  }

  private async submit() {
    if (this.props.selectedIdentity && this.state.isValid) {
      const { selectedIdentity, history } = this.props
      let cType: sdk.CType

      try {
        cType = sdk.CTypeUtils.fromInputModel(this.state.cType)
      } catch (error) {
        errorService.log({
          error,
          message: 'could not create CTYPE from Input Model',
          origin: 'CTypeCreate.onSubmit()',
        })
        return
      }

      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Creating CTYPE',
      })

      cType
        .store(selectedIdentity.identity)
        .then((value: any) => {
          blockUi.updateMessage(
            `CTYPE stored on blockchain,\nnow registering CTYPE`
          )
          const cTypeWrapper: ICType = {
            cType,
            metaData: {
              author: selectedIdentity.identity.address,
            },
          }
          // TODO: add onrejected when sdk provides error handling
          CTypeRepository.register(cTypeWrapper).then(() => {
            blockUi.remove()
            notifySuccess(
              `CTYPE ${cType.metadata.title.default} successfully created.`
            )
            history.push('/cType')
          })
        })
        .catch(error => {
          errorService.log({
            error,
            message: 'Could not onSubmit CTYPE',
            origin: 'CTypeCreate.onSubmit()',
          })
          notifyError(error)
          blockUi.remove()
        })
    }
  }

  private cancel() {
    // TODO: goto CTYPE list or previous screen?
    this.props.history.push('/cType')
  }

  private onUpdateSchemaBySchemaEditor(schema: common.ValueType) {
    console.log('schema', schema)
  }

  private onUpdateSchemaByPlainSchemaEditor(schema: string) {
    console.log('schema', schema)
  }

  // private updateCType = (cType: string, isValid: boolean) => {
  //   this.setState({
  //     cType,
  //     isValid,
  //   })
  // }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(withRouter(CTypeCreate))
