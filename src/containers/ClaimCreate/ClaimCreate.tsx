import * as sdk from '@kiltprotocol/prototype-sdk'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link, withRouter } from 'react-router-dom'
import * as common from 'schema-based-json-editor'

import SchemaEditor from '../../components/SchemaEditor/SchemaEditor'
import CtypeRepository from '../../services/CtypeRepository'
import ErrorService from '../../services/ErrorService'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import * as Claims from '../../state/ducks/Claims'
import * as Wallet from '../../state/ducks/Wallet'
import { BlockUi } from '../../types/UserFeedback'

import './ClaimCreate.scss'

type Props = RouteComponentProps<{
  ctypeKey: string
}> & {
  saveClaim: (claim: sdk.IClaim) => void
  selectedIdentity?: Wallet.Entry
}

type State = {
  claim: any
  name: string
  isValid: boolean
  ctype?: sdk.CType
}

class ClaimCreate extends Component<Props, State> {
  public state = {
    claim: {},
    ctype: undefined,
    isValid: false,
    name: '',
  }

  constructor(props: Props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleNameChange = this.handleNameChange.bind(this)
    this.updateClaim = this.updateClaim.bind(this)
  }

  public componentDidMount() {
    const { ctypeKey } = this.props.match.params

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Fetching CTYPE',
    })

    CtypeRepository.findByKey(ctypeKey).then(
      dbCtype => {
        try {
          const parsedDefinition = JSON.parse(dbCtype.definition)
          const ctype = new sdk.CType(parsedDefinition)
          this.setState({ ctype })
          blockUi.remove()
        } catch (error) {
          ErrorService.log({
            error,
            message: `could not parse definition of CTYPE ${ctypeKey}`,
            origin: 'ClaimCreate.componentDidMount()',
            type: 'ERROR.JSON.PARSE',
          })
          blockUi.remove()
        }
      },
      error => {
        ErrorService.log({
          error,
          message: `could not retrieve CTYPE with key ${ctypeKey}`,
          origin: 'ClaimCreate.componentDidMount()',
          type: 'ERROR.FETCH.GET',
        })
        blockUi.remove()
      }
    )
  }

  public render() {
    const { match }: Props = this.props
    const { ctype, claim, name }: State = this.state

    return (
      <section className="ClaimCreate">
        <h1>New Claim</h1>
        {ctype && (
          <div>
            <div className="Claim-base">
              <div>
                <label>Ctype</label>
                <div>{match.params.ctypeKey}</div>
              </div>
              <div>
                <label>Alias</label>
                <input type="text" onChange={this.handleNameChange} />
              </div>
            </div>
            <SchemaEditor
              schema={ctype!.getClaimInputModel() as common.Schema}
              initialValue={claim}
              updateValue={this.updateClaim}
            />

            <div className="actions">
              <button
                type="submit"
                onClick={this.handleSubmit}
                disabled={!name || name.length === 0}
              >
                Submit
              </button>
            </div>
          </div>
        )}
        {!ctype && (
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
    const { name, claim, ctype }: State = this.state

    if (ctype && selectedIdentity) {
      const newClaim: sdk.Claim = new sdk.Claim(
        name,
        ctype,
        claim,
        selectedIdentity.identity
      )
      saveClaim(newClaim)
      notifySuccess(`Claim ${newClaim.alias} successfully created.`)
      history.push('/claim')
    }
  }

  private handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ name: e.target.value })
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    selectedIdentity: state.wallet.get('selected'),
  }
}

const mapDispatchToProps = (dispatch: (action: Claims.Action) => void) => {
  return {
    saveClaim: (claim: sdk.IClaim) => {
      dispatch(Claims.Store.saveAction(claim))
    },
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ClaimCreate)
)
