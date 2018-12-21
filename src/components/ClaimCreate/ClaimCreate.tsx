import { CType } from '@kiltprotocol/prototype-sdk'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'
import * as common from 'schema-based-json-editor'

import ctypeRepository from '../../services/CtypeRepository'
import ErrorService from '../../services/ErrorService'
import * as Claims from '../../state/ducks/Claims'
import { Claim } from '../../types/Claim'
import SchemaEditor from '../SchemaEditor/SchemaEditor'

type Props = RouteComponentProps<{
  ctypeKey: string
}> & {
  saveClaim: (alias: string, claim: Claim) => void
}

type State = {
  claim: any
  name: string
  isValid: boolean
  ctype?: CType
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
  }

  public componentDidMount() {
    const { ctypeKey } = this.props.match.params
    ctypeRepository.findByKey(ctypeKey).then(dbCtype => {
      try {
        const ctype = CType.fromInputModel(JSON.parse(dbCtype.definition))
        this.setState({ ctype })
      } catch (e) {
        ErrorService.log('JSON.parse', e)
      }
    })
  }

  public render() {
    const { match }: Props = this.props
    const { ctype, claim }: State = this.state

    return (
      <section className="ClaimCreate">
        <h1>New Claim</h1>
        <div>Ctype: {match.params.ctypeKey}</div>
        {ctype && (
          <div>
            <input
              type="text"
              placeholder="Alias"
              onChange={this.handleNameChange}
            />
            <br />
            <SchemaEditor
              schema={ctype!.getClaimInputModel() as common.Schema}
              initialValue={claim}
              updateValue={this.updateClaim}
            />

            <div className="actions">
              <button type="submit" onClick={this.handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        )}
      </section>
    )
  }

  private updateClaim = (claim: common.ValueType, isValid: boolean) => {
    this.setState({
      claim,
      isValid,
    })
  }

  private handleSubmit() {
    const { saveClaim } = this.props
    const { name, claim }: State = this.state

    saveClaim(name, { contents: claim })
  }

  private handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ name: e.target.value })
  }
}

const mapStateToProps = () => {
  return {}
}

const mapDispatchToProps = (dispatch: (action: Claims.Action) => void) => {
  return {
    saveClaim: (alias: string, claim: Claim) => {
      dispatch(Claims.Store.saveAction(alias, claim))
    },
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ClaimCreate)
)
