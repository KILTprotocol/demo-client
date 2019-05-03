import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { RequestAcceptDelegationProps } from '../../containers/Tasks/RequestAcceptDelegation/RequestAcceptDelegation'

import * as Delegations from '../../state/ducks/Delegations'
import { MyDelegation } from '../../state/ducks/Delegations'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import Permissions from '../Permissions/Permissions'
import SelectDelegationAction from '../SelectDelegationAction/SelectDelegationAction'

import './MyDelegationsListView.scss'

type Props = {
  onCreateDelegation: () => void
  delegationEntries: MyDelegation[]
  onRemoveDelegation: (delegation: MyDelegation) => void

  isPCR: boolean
}

type State = {}

class MyDelegationsListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.handleCreate = this.handleCreate.bind(this)
  }

  public render() {
    const { isPCR } = this.props

    return (
      <section className="MyDelegationsListView">
        <h1>My {isPCR ? 'PCRs' : 'Delegations'}</h1>
        {this.getDelegationEntries()}
        <div className="actions">
          <button className="create" onClick={this.handleCreate}>
            New {isPCR ? 'PCR' : 'Delegation'}
          </button>
        </div>
      </section>
    )
  }

  private getDelegationEntries() {
    const { delegationEntries, isPCR } = this.props
    return (
      delegationEntries &&
      !!delegationEntries.length && (
        <table>
          <thead>
            <tr>
              <th className="alias_ctype">
                Alias
                <br />
                CTYPE
              </th>
              <th className="alias">Alias</th>
              <th className="type">Type</th>
              <th className="cType">CType</th>
              <th className="permissions">Permissions</th>
              <th className="id">ID</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {delegationEntries.map((delegationEntry: MyDelegation) => {
              const cTypeHash = delegationEntry.cTypeHash
              return (
                <tr key={delegationEntry.id}>
                  <td className="alias_ctype">
                    <Link
                      to={`/${isPCR ? 'pcrs' : 'delegations'}/${
                        delegationEntry.id
                      }`}
                    >
                      {delegationEntry.metaData.alias}
                    </Link>
                    {cTypeHash ? (
                      <CTypePresentation
                        cTypeHash={cTypeHash}
                        linked={true}
                        interactive={true}
                      />
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="alias">
                    <Link
                      to={`/${isPCR ? 'pcrs' : 'delegations'}/${
                        delegationEntry.id
                      }`}
                    >
                      {delegationEntry.metaData.alias}
                    </Link>
                  </td>
                  <td className="type">
                    {delegationEntry.type === Delegations.DelegationType.Root
                      ? 'root'
                      : 'node'}
                  </td>
                  <td className="cType">
                    {cTypeHash ? (
                      <CTypePresentation
                        cTypeHash={cTypeHash}
                        linked={true}
                        interactive={true}
                      />
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="permissions">
                    {delegationEntry.permissions && (
                      <Permissions permissions={delegationEntry.permissions} />
                    )}
                    {!delegationEntry.permissions &&
                      delegationEntry.type ===
                        Delegations.DelegationType.Root && (
                        <Permissions permissions={[1, 2]} />
                      )}
                    {!delegationEntry.permissions &&
                      delegationEntry.type !==
                        Delegations.DelegationType.Root && (
                        <Permissions permissions={[]} />
                      )}
                  </td>
                  <td className="id">{delegationEntry.id}</td>
                  <td className="actionsTd">
                    <div>
                      <SelectDelegationAction
                        delegation={delegationEntry}
                        onInvite={this.inviteContactsTo.bind(
                          this,
                          delegationEntry
                        )}
                        onDelete={this.handleDelete.bind(this, delegationEntry)}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    )
  }

  private handleCreate(): void {
    const { onCreateDelegation } = this.props
    if (onCreateDelegation) {
      onCreateDelegation()
    }
  }

  private inviteContactsTo(delegation: MyDelegation) {
    PersistentStore.store.dispatch(
      UiState.Store.updateCurrentTaskAction({
        objective: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION,
        props: {
          cTypeHash: delegation.cTypeHash,
          isPCR: !!delegation.isPCR,
          selectedDelegations: [delegation],
        } as RequestAcceptDelegationProps,
      })
    )
  }

  private handleDelete = (delegation: MyDelegation) => {
    const { onRemoveDelegation } = this.props
    onRemoveDelegation(delegation)
  }
}

export default MyDelegationsListView
