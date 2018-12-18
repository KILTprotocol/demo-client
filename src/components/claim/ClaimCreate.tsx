import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { withRouter } from 'react-router-dom'

import { CType } from '@kiltprotocol/prototype-sdk'
import * as common from 'schema-based-json-editor'

import ctypeRepository from '../../services/CtypeRepository'
import SchemaEditorComponent from '../schema-editor/SchemaEditorComponent'

type Props = RouteComponentProps<{
  ctypeKey: string
}>

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
      const ctype = CType.fromInputModel(JSON.parse(dbCtype.definition))
      this.setState({ ctype })
    })
  }

  public render() {
    const { match }: Props = this.props
    const { ctype, claim }: State = this.state

    return (
      <div className="ClaimCreate">
        <h1>New Claim</h1>
        <div>Ctype: {match.params.ctypeKey}</div>
        <input type="text" placeholder="Name" />
        <br />
        {ctype && (
          <SchemaEditorComponent
            schema={ctype!.getClaimInputModel() as common.Schema}
            initialValue={claim}
            updateValue={this.updateClaim}
          />
        )}
        <button type="submit">Submit</button>
      </div>
    )
  }

  private updateClaim = (claim: common.ValueType, isValid: boolean) => {
    this.setState({
      isValid,
    })
    this.setState({ claim })
  }

  private handleSubmit() {}

  private handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ name: e.target.value })
  }
}

/* const mapStateToProps = (state: { wallet: WalletState }) => {
  return {
    identities: state.wallet
      .get('identities')
      .toList()
      .toArray(),
  }
}

const mapDispatchToProps = (dispatch: (action: WalletAction) => void) => {
  return {
    removeIdentity: (seedAsHex: string) => {
      dispatch(WalletRedux.removeIdentityAction(seedAsHex))
    },
    saveIdentity: (alias: string, identity: Identity) => {
      dispatch(WalletRedux.saveIdentityAction(alias, identity))
    },
  }
} */

export default withRouter(
  connect()(ClaimCreate)
  // mapStateToProps,
  // mapDispatchToProps
)
