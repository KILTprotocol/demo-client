import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import DelegationDetailView from '../../../components/DelegationDetailView/DelegationDetailView'
import DelegationsService from '../../../services/DelegationsService'
import { notifyFailure, notifySuccess } from '../../../services/FeedbackService'
import * as Delegations from '../../../state/ducks/Delegations'

import './ImportDelegation.scss'

type Props = {
  delegationId: sdk.IDelegationBaseNode['id']
  isPCR: boolean

  onFinished?: () => void
}

type State = {
  alias: string
}

class ImportDelegation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      alias: '',
    }
    this.importDelegation = this.importDelegation.bind(this)
    this.handleAliasChange = this.handleAliasChange.bind(this)
  }

  public render() {
    const { delegationId, isPCR } = this.props
    const { alias } = this.state

    return (
      <section className="ImportDelegation">
        <div className="Delegation-base">
          <div>
            <label>Name your {isPCR ? 'PCR member' : 'delegation'}</label>
            <input type="text" onChange={this.handleAliasChange} />
          </div>
        </div>

        <DelegationDetailView id={delegationId} isPCR={isPCR} />

        <div className="actions">
          <button onClick={this.importDelegation} disabled={!alias}>
            Import {isPCR ? 'PCR member' : 'delegation'}
          </button>
        </div>
      </section>
    )
  }

  private handleAliasChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      alias: e.target.value.trim(),
    })
  }

  private importDelegation() {
    const { delegationId, isPCR, onFinished } = this.props
    const { alias } = this.state

    DelegationsService.importDelegation(delegationId, alias, isPCR)
      .then((myDelegation: Delegations.MyDelegation | undefined) => {
        if (myDelegation) {
          notifySuccess(
            `${isPCR ? 'PCR member' : 'Delegation'} successfully imported.`
          )
          if (onFinished) {
            onFinished()
          }
        } else {
          notifyFailure(
            `${
              isPCR ? 'PCR member' : 'Delegation'
            } not found for id '${delegationId}'`
          )
        }
      })
      .catch(error => {
        notifyFailure(`Unable to import ${isPCR ? 'PCR member' : 'delegation'}`)
      })
  }
}

export default ImportDelegation
