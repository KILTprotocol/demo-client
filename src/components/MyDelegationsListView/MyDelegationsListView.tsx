import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'
import { Link } from 'react-router-dom'
import { RequestAcceptDelegationProps } from '../../containers/Tasks/RequestAcceptDelegation/RequestAcceptDelegation'

import * as Delegations from '../../state/ducks/Delegations'
import { IMyDelegation } from '../../state/ducks/Delegations'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import Permissions from '../Permissions/Permissions'
import SelectDelegationAction from '../SelectDelegationAction/SelectDelegationAction'

import './MyDelegationsListView.scss'
import QRCodeDelegationID from '../QRCodeDelegationID/QRCodeDelegationID'

type Props = {
  onCreateDelegation: () => void
  delegationEntries: IMyDelegation[]
  onRemoveDelegation: (delegation: IMyDelegation) => void

  isPCR: boolean
}

type State = {
  showDelegationQRCode: boolean
}

class MyDelegationsListView extends React.Component<Props, State> {
  private static inviteContactsTo(delegation: IMyDelegation): void {
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

  constructor(props: Props) {
    super(props)
    this.state = {
      showDelegationQRCode: false,
    }
    this.handleCreate = this.handleCreate.bind(this)
  }

  private getDelegationEntries(): false | JSX.Element {
    const { delegationEntries, isPCR } = this.props
    const { showDelegationQRCode } = this.state
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
            {delegationEntries.map((delegationEntry: IMyDelegation) => {
              const { cTypeHash } = delegationEntry
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
                        linked
                        interactive
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
                        linked
                        interactive
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
                  <td className="id">
                    <button
                      type="button"
                      onClick={() => this.delegationQRCode()}
                    >
                      {!showDelegationQRCode && delegationEntry.id}
                    </button>
                    {showDelegationQRCode && (
                      <QRCodeDelegationID delegation={delegationEntry} />
                    )}
                  </td>
                  <td className="actionsTd">
                    <div>
                      <SelectDelegationAction
                        delegation={delegationEntry}
                        onInvite={() =>
                          MyDelegationsListView.inviteContactsTo(
                            delegationEntry
                          )
                        }
                        onDelete={() => this.handleDelete(delegationEntry)}
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

  private delegationQRCode = (): void => {
    const { showDelegationQRCode } = this.state
    this.setState({ showDelegationQRCode: !showDelegationQRCode })
  }

  private handleDelete = (delegation: IMyDelegation): void => {
    const { onRemoveDelegation } = this.props
    onRemoveDelegation(delegation)
  }

  private handleCreate(): void {
    const { onCreateDelegation } = this.props
    if (onCreateDelegation) {
      onCreateDelegation()
    }
  }

  public render(): JSX.Element {
    const { isPCR } = this.props

    return (
      <section className="MyDelegationsListView">
        <h1>My {isPCR ? 'PCRs' : 'Delegations'}</h1>
        {this.getDelegationEntries()}
        <div className="actions">
          <button type="button" className="create" onClick={this.handleCreate}>
            New {isPCR ? 'PCR' : 'Delegation'}
          </button>
        </div>
      </section>
    )
  }
}

export default MyDelegationsListView
