import * as React from 'react'
import { Link } from 'react-router-dom'

import * as Delegations from '../../state/ducks/Delegations'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

import './MyDelegationsListView.scss'

type Props = {
  delegationEntries: Delegations.Entry[]
  onRemoveDelegation: (delegation: Delegations.Entry) => void
  onCreateDelegation: () => void
}

type State = {}

class MyDelegationsListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.handleCreate = this.handleCreate.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
  }

  public render() {
    const { delegationEntries } = this.props
    return (
      <section className="MyDelegationsListView">
        <h1>My Delegations</h1>
        {delegationEntries && !!delegationEntries.length && (
          <table>
            <thead>
              <tr>
                <th className="alias">Alias</th>
                <th className="id">ID</th>
                <th className="cType">CTYPE</th>
                <th className="account">Account</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {delegationEntries.map(delegationEntry => (
                <tr key={delegationEntry.id}>
                  <td className="alias">
                    <Link to={`/delegations/${delegationEntry.id}`}>
                      {delegationEntry.metaData.alias}
                    </Link>
                  </td>
                  <td className="id">{delegationEntry.id}</td>
                  <td className="cType">
                    <CTypePresentation cTypeHash={delegationEntry.cType} />
                  </td>
                  <td className="account">
                    <ContactPresentation address={delegationEntry.account} />
                  </td>
                  <td className="actionsTd">
                    <button
                      className="delete"
                      onClick={this.handleDelete(delegationEntry)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="actions">
          <button className="create" onClick={this.handleCreate}>
            New Delegation
          </button>
        </div>
      </section>
    )
  }

  private handleCreate(): void {
    const { onCreateDelegation } = this.props
    if (onCreateDelegation) {
      onCreateDelegation()
    }
  }

  private handleDelete = (
    delegation: Delegations.Entry
  ): (() => void) => () => {
    const { onRemoveDelegation } = this.props
    onRemoveDelegation(delegation)
  }
}

export default MyDelegationsListView
