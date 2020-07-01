import * as sdk from '@kiltprotocol/sdk-js'
import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { Link } from 'react-router-dom'

import * as common from 'schema-based-json-editor'
import SchemaEditor from '../SchemaEditor/SchemaEditor'
import CTypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import * as Claims from '../../state/ducks/Claims'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { ICTypeWithMetadata } from '../../types/Ctype'
import { BlockUi } from '../../types/UserFeedback'
import { getClaimInputModel } from '../../utils/CtypeUtils'

import './MyClaimCreateView.scss'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import Input from '../Input/Input'

type StateProps = {
  selectedIdentity?: Wallet.Entry
}

type DispatchProps = {
  saveClaim: (claim: sdk.IClaim, meta: { alias: string }) => void
}

type OwnProps = {
  onCancel?: () => void
  onCreate: (claim: sdk.Claim) => void
  partialClaim: sdk.IPartialClaim
}

type Props = StateProps & DispatchProps & OwnProps

type State = {
  partialClaim: sdk.IPartialClaim
  name: string
  cType?: ICTypeWithMetadata
}

class MyClaimCreateView extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.handleCancel = this.handleCancel.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleNameChange = this.handleNameChange.bind(this)
    this.updateClaim = this.updateClaim.bind(this)
    this.state = {
      name: '',
      partialClaim: { ...props.partialClaim },
    }
  }

  public componentDidMount(): void {
    const { partialClaim } = this.state
    const { cTypeHash } = partialClaim

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Fetching CTYPE',
    })

    CTypeRepository.findByHash(cTypeHash)
      .then((dbCtype: ICTypeWithMetadata) => {
        this.setState({ cType: dbCtype })
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

  private updateClaim(contents: sdk.Claim['contents']): void {
    const { partialClaim } = this.state
    this.setState({
      partialClaim: { ...partialClaim, contents: { ...contents } },
    })
  }

  private handleCancel(): void {
    const { onCancel } = this.props

    if (onCancel) {
      onCancel()
    }
  }

  private handleSubmit(): void {
    const { saveClaim, selectedIdentity, onCreate } = this.props
    const { name, partialClaim, cType }: State = this.state
    const { contents } = partialClaim

    if (cType && selectedIdentity) {
      const newClaim: sdk.Claim = sdk.Claim.fromCTypeAndClaimContents(
        sdk.CType.fromCType(cType.cType),
        contents || {},
        selectedIdentity.identity.getAddress()
      )
      saveClaim(newClaim, { alias: name })
      notifySuccess(`Claim ${name} successfully created & saved.`)
      onCreate(newClaim)
    }
  }

  private handleNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ name: e.target.value })
  }

  public render(): JSX.Element {
    const { onCancel }: Props = this.props
    const { cType, partialClaim, name }: State = this.state
    const { contents } = partialClaim

    return (
      <section className="MyClaimCreateView">
        <h1>New Claim</h1>
        {cType && (
          <>
            <div className="Claim-base">
              <div>
                <label>CType</label>
                <div>
                  <CTypePresentation cTypeHash={cType.cType.hash} linked />
                </div>
              </div>
              <div>
                <label>Claim alias</label>
                <Input
                  type="text"
                  autoFocus
                  onChange={this.handleNameChange}
                  onSubmit={this.handleSubmit}
                />
              </div>
            </div>
            <SchemaEditor
              schema={getClaimInputModel(cType) as common.Schema}
              initialValue={contents}
              updateValue={this.updateClaim}
            />

            <div className="actions">
              {onCancel && (
                <button type="button" onClick={this.handleCancel}>
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={this.handleSubmit}
                disabled={!name || name.length === 0}
              >
                Create
              </button>
            </div>
          </>
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
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps: DispatchProps = {
  saveClaim: (claim: sdk.IClaim, meta: { alias: string }) =>
    Claims.Store.saveAction(claim, meta),
}

export default connect(mapStateToProps, mapDispatchToProps)(MyClaimCreateView)
