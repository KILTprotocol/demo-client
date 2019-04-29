import * as sdk from '@kiltprotocol/prototype-sdk'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import * as common from 'schema-based-json-editor'
import SchemaEditor from '../../components/SchemaEditor/SchemaEditor'
import CTypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import * as Claims from '../../state/ducks/Claims'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { ICType } from '../../types/Ctype'
import { BlockUi } from '../../types/UserFeedback'

import './MyClaimCreateView.scss'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import Input from '../Input/Input'

type Props = {
  onCancel?: () => void
  onCreate: (claim: sdk.Claim) => void
  partialClaim: sdk.IPartialClaim
  saveClaim: (claim: sdk.IClaim, meta: { alias: string }) => void
  selectedIdentity?: Wallet.Entry
}

type State = {
  partialClaim: sdk.IPartialClaim
  name: string
  isValid: boolean
  cType?: sdk.CType
}

class MyClaimCreateView extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.handleCancel = this.handleCancel.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleNameChange = this.handleNameChange.bind(this)
    this.updateClaim = this.updateClaim.bind(this)

    this.state = {
      isValid: false,
      name: '',
      partialClaim: { ...props.partialClaim },
    }
  }

  public componentDidMount() {
    const { partialClaim } = this.state
    const { cType: cTypeHash } = partialClaim

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Fetching CTYPE',
    })

    CTypeRepository.findByHash(cTypeHash)
      .then((dbCtype: ICType) => {
        const cType = new sdk.CType(dbCtype.cType)
        this.setState({ cType })
        blockUi.remove()
      })
      .catch(error => {
        errorService.log({
          error,
          message: `could not retrieve CTYPE with key ${cTypeHash}`,
          origin: 'ClaimCreate.componentDidMount()',
          type: 'ERROR.FETCH.GET',
        })
        blockUi.remove()
      })
  }

  public render() {
    const { onCancel }: Props = this.props
    const { cType, partialClaim, name }: State = this.state
    const { contents } = partialClaim

    return (
      <section className="MyClaimCreateView">
        <h1>New Claim</h1>
        {cType && (
          <React.Fragment>
            <div className="Claim-base">
              <div>
                <label>CType</label>
                <div>
                  <CTypePresentation cTypeHash={cType.hash} />
                </div>
              </div>
              <div>
                <label>Claim alias</label>
                <Input
                  type="text"
                  autoFocus={true}
                  onChange={this.handleNameChange}
                  onSubmit={this.handleSubmit}
                />
              </div>
            </div>
            <SchemaEditor
              schema={cType!.getClaimInputModel() as common.Schema}
              initialValue={contents}
              updateValue={this.updateClaim}
            />

            <div className="actions">
              {onCancel && <button onClick={this.handleCancel}>Cancel</button>}
              <button
                onClick={this.handleSubmit}
                disabled={!name || name.length === 0}
              >
                Create
              </button>
            </div>
          </React.Fragment>
        )}
        {!cType && (
          <p>
            <span>No CTYPEs found. Please </span>
            <Link to="/ctype/new">create a new CTYPE</Link>.
          </p>
        )}
      </section>
    )
  }

  private updateClaim(contents: sdk.Claim['contents'], isValid: boolean) {
    const { partialClaim } = this.state
    this.setState({
      isValid,
      partialClaim: { ...partialClaim, contents: { ...contents } },
    })
  }

  private handleCancel() {
    const { onCancel } = this.props

    if (onCancel) {
      onCancel()
    }
  }

  private handleSubmit() {
    const { saveClaim, selectedIdentity, onCreate } = this.props
    const { name, partialClaim, cType }: State = this.state
    const { contents } = partialClaim

    if (cType && selectedIdentity) {
      const newClaim: sdk.IClaim = new sdk.Claim(
        cType,
        contents || {},
        selectedIdentity.identity
      )
      saveClaim(newClaim, { alias: name })
      notifySuccess(`Claim ${name} successfully created & saved.`)
      onCreate(newClaim)
    }
  }

  private handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ name: e.target.value })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps = (dispatch: (action: Claims.Action) => void) => {
  return {
    saveClaim: (claim: sdk.IClaim, meta: { alias: string }) => {
      dispatch(Claims.Store.saveAction(claim, meta))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyClaimCreateView)
