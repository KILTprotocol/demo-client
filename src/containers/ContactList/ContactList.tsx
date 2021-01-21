import React, { ChangeEvent } from 'react'

import { connect, MapStateToProps } from 'react-redux'

import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import ContactRepository from '../../services/ContactRepository'
import * as Contacts from '../../state/ducks/Contacts'
import { State as ReduxState } from '../../state/PersistentStore'
import { IContact } from '../../types/Contact'

import './ContactList.scss'

type StateProps = {
  myContacts: IContact[]
}

type Props = StateProps

type State = {
  importViaDID: {
    alias: string
    didAddress: string
  }
}

class ContactList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      importViaDID: {
        alias: '',
        didAddress: '',
      },
    }

    this.importViaDID = this.importViaDID.bind(this)
  }

  private getImportViaDID(): JSX.Element {
    const { importViaDID } = this.state
    return (
      <section className="importViaDID">
        <h2>Import via DID</h2>
        <div>
          <label>DID</label>
          <div>
            <input
              type="text"
              value={importViaDID.didAddress}
              onChange={this.prepareImportViaDID.bind(this, 'didAddress')}
            />
          </div>
        </div>
        <div>
          <label>Alias</label>
          <div>
            <input
              type="text"
              value={importViaDID.alias}
              onChange={this.prepareImportViaDID.bind(this, 'alias')}
            />
          </div>
        </div>
        <div className="actions">
          <button
            type="button"
            onClick={this.importViaDID}
            disabled={!importViaDID.didAddress || !importViaDID.alias}
          >
            Import
          </button>
        </div>
      </section>
    )
  }

  private static getContactRow(contact: IContact): JSX.Element {
    const { publicIdentity } = contact
    const { address } = publicIdentity

    return (
      <tr key={address}>
        <td className="name">
          <ContactPresentation address={address} interactive fullSizeActions />
        </td>
      </tr>
    )
  }

  private prepareImportViaDID(
    key: 'didAddress' | 'alias',
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const { importViaDID } = this.state
    const { value } = event.target
    this.setState({
      importViaDID: { ...importViaDID, [key]: value },
    })
  }

  private importViaDID(): void {
    const { importViaDID } = this.state

    if (importViaDID.didAddress && importViaDID.alias) {
      ContactRepository.importViaDID(
        importViaDID.didAddress,
        importViaDID.alias
      )
        .then(() => {
          this.setState({
            importViaDID: {
              alias: '',
              didAddress: '',
            },
          })
        })
        .catch(() => {
          // prevent clearing of input fields
        })
    }
  }

  public render(): JSX.Element {
    const { myContacts } = this.props

    const contacts = myContacts

    return (
      <section className="ContactList">
        <h1>My contacts</h1>
        <div className="contactActions" />
        <table>
          <thead>
            <tr>
              <th className="name">Name</th>
            </tr>
          </thead>
          <tbody>
            {!contacts.length && (
              <tr>
                <td>
                  <div className="noContactsMessage">No contacts found.</div>
                </td>
              </tr>
            )}
            {!!contacts.length &&
              contacts.map((contact: IContact) =>
                ContactList.getContactRow(contact)
              )}
          </tbody>
        </table>
        {this.getImportViaDID()}
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  myContacts: Contacts.getMyContacts(state),
})

export default connect(mapStateToProps)(ContactList)
