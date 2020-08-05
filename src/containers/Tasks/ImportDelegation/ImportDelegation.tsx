import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import DelegationDetailView from '../../../components/DelegationDetailView/DelegationDetailView'
import DelegationsService from '../../../services/DelegationsService'
import { notifyFailure, notifySuccess } from '../../../services/FeedbackService'
import * as Delegations from '../../../state/ducks/Delegations'

import './ImportDelegation.scss'

type Props = {
  delegationId: sdk.IDelegationBaseNode['id']
  isPCR: boolean

  onCancel?: () => void
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

    this.onCancel = this.onCancel.bind(this)
    this.importDelegation = this.importDelegation.bind(this)
    this.handleAliasChange = this.handleAliasChange.bind(this)
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private handleAliasChange(e: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      alias: e.target.value.trim(),
    })
  }

  private importDelegation(): void {
    const { delegationId, isPCR, onFinished } = this.props
    const { alias } = this.state

    DelegationsService.importDelegation(delegationId, alias, isPCR)
      .then((myDelegation: Delegations.IMyDelegation | null) => {
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
      .catch(() => {
        notifyFailure(`Unable to import ${isPCR ? 'PCR member' : 'delegation'}`)
      })
  }

  public render(): JSX.Element {
    const { delegationId, isPCR } = this.props
    const { alias } = this.state

    return (
      <section className="ImportDelegation">
        <section className="Delegation-base">
          <h2>Name your {isPCR ? 'PCR member' : 'delegation'}</h2>
          <div>
            <input type="text" onChange={this.handleAliasChange} />
          </div>
        </section>

        <DelegationDetailView delegationId={delegationId} isPCR={isPCR} />

        <div className="actions">
          <button type="button" onClick={this.onCancel}>
            Cancel
          </button>
          <button
            type="button"
            onClick={this.importDelegation}
            disabled={!alias}
          >
            Import {isPCR ? 'PCR member' : 'delegation'}
          </button>
        </div>
      </section>
    )
  }
}

export default ImportDelegation
