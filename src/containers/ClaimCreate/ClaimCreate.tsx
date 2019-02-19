import * as sdk from '@kiltprotocol/prototype-sdk'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import * as common from 'schema-based-json-editor'

import SchemaEditor from '../../components/SchemaEditor/SchemaEditor'
import CtypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import * as Claims from '../../state/ducks/Claims'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { ICType } from '../../types/Ctype'
import { BlockUi } from '../../types/UserFeedback'

import './ClaimCreate.scss'

type Props = RouteComponentProps<{
  cTypeHash: sdk.ICType['hash']
}> & {
  saveClaim: (claim: sdk.IClaim, meta: { alias: string }) => void
  selectedIdentity?: Wallet.Entry
}

type State = {
  claim: any
  cType?: sdk.CType
  isValid: boolean
  name: string
}

class ClaimCreate extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      claim: {},
      isValid: false,
      name: '',
    }
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleNameChange = this.handleNameChange.bind(this)
    this.updateClaim = this.updateClaim.bind(this)
  }

  public componentDidMount() {
    const { cTypeHash } = this.props.match.params

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Fetching CTYPE',
    })

    CtypeRepository.findByHash(cTypeHash).then(
      (dbCtype: ICType) => {
        const cType = sdk.CType.fromObject(dbCtype.cType)
        this.setState({ cType })
        blockUi.remove()
      },
      error => {
        errorService.log({
          error,
          message: `could not retrieve CTYPE with key ${cTypeHash}`,
          origin: 'ClaimCreate.componentDidMount()',
          type: 'ERROR.FETCH.GET',
        })
        blockUi.remove()
      }
    )
  }

  public render() {
    const { cType, claim, name }: State = this.state

    return (
      <section className="ClaimCreate">
        <h1>New Claim</h1>
        {cType && (
          <React.Fragment>
            <div className="Claim-base">
              <div>
                <label>CType</label>
                <div>{cType.metadata.title.default}</div>
              </div>
              <div>
                <label>Claim alias</label>
                <input type="text" onChange={this.handleNameChange} />
              </div>
            </div>
            <SchemaEditor
              schema={cType.getClaimInputModel() as common.Schema}
              initialValue={claim}
              updateValue={this.updateClaim}
            />

            <div className="actions">
              <Link to="/claim">Cancel</Link>
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

  private updateClaim(claim: common.ValueType, isValid: boolean) {
    this.setState({
      claim,
      isValid,
    })
  }

  private handleSubmit() {
    const { saveClaim, selectedIdentity, history } = this.props
    const { name, claim, cType }: State = this.state

    if (cType && selectedIdentity) {
      const newClaim: sdk.Claim = new sdk.Claim(
        cType,
        claim,
        selectedIdentity.identity
      )

      console.log('newClaim', newClaim)

      saveClaim(newClaim, { alias: name })
      notifySuccess(`Claim ${name} successfully created.`)
      history.push('/claim')
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

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ClaimCreate)
)
