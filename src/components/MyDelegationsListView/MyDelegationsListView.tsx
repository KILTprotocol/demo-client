import * as React from 'react'
import { Link } from 'react-router-dom'
import { MyDelegation } from '../../state/ducks/Delegations'

import * as Delegations from '../../state/ducks/Delegations'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

import './MyDelegationsListView.scss'
import SelectAction from '../SelectAction/SelectAction'

type Props = {
  onCreateDelegation: () => void
  delegationEntries: MyDelegation[]
  onRemoveDelegation: (delegation: Delegations.Entry) => void
  onRequestInviteContacts: (delegation: Delegations.Entry) => void
}

type State = {}

class MyDelegationsListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.handleCreate = this.handleCreate.bind(this)
  }

  public render() {
    return (
      <section className="MyDelegationsListView">
        <h1>My Delegations</h1>
        {this.getDelegationEntries()}
        <div className="actions">
          <button className="create" onClick={this.handleCreate}>
            New Delegation
          </button>
        </div>
      </section>
    )
  }

  private getDelegationEntries() {
    const { delegationEntries } = this.props
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
              <th className="id">ID</th>
              <th className="cType">CTYPE</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {delegationEntries.map((delegationEntry: MyDelegation) => {
              const cTypeHash = delegationEntry.cTypeHash
              return (
                <tr key={delegationEntry.id}>
                  <td className="alias_ctype">
                    <Link to={`/delegations/${delegationEntry.id}`}>
                      {delegationEntry.metaData.alias}
                    </Link>
                    {cTypeHash ? (
                      <CTypePresentation cTypeHash={cTypeHash} />
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="alias">
                    <Link to={`/delegations/${delegationEntry.id}`}>
                      {delegationEntry.metaData.alias}
                    </Link>
                  </td>
                  <td>
                    {delegationEntry.type === Delegations.DelegationType.Root
                      ? 'root'
                      : 'node'}
                  </td>
                  <td className="id">{delegationEntry.id}</td>
                  <td className="cType">
                    {cTypeHash ? (
                      <CTypePresentation cTypeHash={cTypeHash} />
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="actionsTd">
                    <div>
                      <SelectAction
                        actions={[
                          {
                            callback: this.requestInviteContacts.bind(
                              this,
                              delegationEntry
                            ),
                            label: 'Invite contact',
                          },
                          {
                            callback: this.handleDelete.bind(
                              this,
                              delegationEntry
                            ),
                            label: 'Delete',
                          },
                        ]}
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

  private requestInviteContacts(delegationEntry: Delegations.Entry) {
    const { onRequestInviteContacts } = this.props

    if (onRequestInviteContacts) {
      onRequestInviteContacts(delegationEntry)
    }
  }

  private handleDelete = (delegation: Delegations.Entry) => {
    const { onRemoveDelegation } = this.props
    onRemoveDelegation(delegation)
  }
}

export default MyDelegationsListView
