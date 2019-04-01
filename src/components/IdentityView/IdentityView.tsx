import * as React from 'react'
import { connect } from 'react-redux'

import ContactRepository from '../../services/ContactRepository'
import contactRepository from '../../services/ContactRepository'
import errorService from '../../services/ErrorService'
import { notifySuccess } from '../../services/FeedbackService'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

import './IdentityView.scss'

type Props = {
  // input
  myIdentity: MyIdentity
  selected: boolean
  // output
  onDelete?: (address: MyIdentity['identity']['address']) => void
  onSelect?: (seedAsHex: MyIdentity['identity']['address']) => void
  onCreateDid?: (identity: MyIdentity) => void
  onDeleteDid?: (identity: MyIdentity) => void
  // mapStateToProps
  contacts: Contact[]
}

type State = {}

class IdentityView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.registerContact = this.registerContact.bind(this)
    this.toggleContacts = this.toggleContacts.bind(this)
  }

  public render() {
    const {
      contacts,
      myIdentity,
      selected,

      onDelete,
      onSelect,
      onCreateDid,
      onDeleteDid,
    } = this.props

    const contact = contacts.find(
      (myContact: Contact) =>
        myContact.publicIdentity.address === myIdentity.identity.address
    )

    const classes = ['IdentityView', selected ? 'selected' : '']

    return (
      <section className={classes.join(' ')}>
        {selected && <h2>Active identity</h2>}
        <ContactPresentation contact={contact} size={50} />
        <div className="attributes">
          <div>
            <label>Alias</label>
            <div>{myIdentity.metaData.name}</div>
          </div>
          <div>
            <label>Phrase</label>
            <div>{myIdentity.phrase}</div>
          </div>
          <div>
            <label>Address</label>
            <div>{myIdentity.identity.address}</div>
          </div>
          <div>
            <label>Seed (as hex)</label>
            <div>{myIdentity.identity.seedAsHex}</div>
          </div>
          <div>
            <label>Public Key</label>
            <div>{myIdentity.identity.signPublicKeyAsHex}</div>
          </div>
          <div>
            <label>Encryption Public Key</label>
            <div>{myIdentity.identity.boxPublicKeyAsHex}</div>
          </div>
          <div>
            <label>DID</label>
            <div>
              {myIdentity.did ? (
                <span className="did">{myIdentity.did}</span>
              ) : (
                ''
              )}
              <span className="didActions">
                {onCreateDid && !myIdentity.did && (
                  <button
                    title="Generate DID..."
                    className="didCreate"
                    onClick={onCreateDid.bind(this, myIdentity)}
                  />
                )}
                {onDeleteDid && myIdentity.did && (
                  <button
                    title="Delete DID"
                    className="didDelete"
                    onClick={onDeleteDid.bind(this, myIdentity)}
                  />
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="actions">
          {!selected && (
            <>
              {onDelete && (
                <button
                  onClick={onDelete.bind(this, myIdentity.identity.address)}
                  disabled={selected}
                >
                  Remove
                </button>
              )}
              {onSelect && (
                <button
                  onClick={onSelect.bind(this, myIdentity.identity.address)}
                  disabled={selected}
                >
                  Select
                </button>
              )}
            </>
          )}
          {contact && (
            <button
              className={`toggleContacts ${
                contact.metaData.addedAt ? 'isMyContact' : 'isNotMyContact'
              }`}
              onClick={this.toggleContacts}
            />
          )}
          {!contact && <button onClick={this.registerContact}>Register</button>}
        </div>
      </section>
    )
  }

  private registerContact() {
    const { myIdentity } = this.props
    const { identity, metaData } = myIdentity
    const { address, boxPublicKeyAsHex } = identity
    const { name } = metaData

    const contact: Contact = {
      metaData: { name },
      publicIdentity: { address, boxPublicKeyAsHex },
    }

    contactRepository.add(contact).then(
      () => {
        notifySuccess(`Identity '${name}' successfully registered.`)
      },
      error => {
        errorService.log({
          error,
          message: `Failed to register identity '${name}'`,
          origin: 'IdentityView.registerContact()',
          type: 'ERROR.FETCH.POST',
        })
      }
    )
  }

  private toggleContacts() {
    const { contacts, myIdentity } = this.props

    const contact = contacts.find(
      (myContact: Contact) =>
        myContact.publicIdentity.address === myIdentity.identity.address
    )

    if (!contact) {
      return
    }

    const { metaData, publicIdentity } = contact

    if (contact.metaData.addedAt) {
      PersistentStore.store.dispatch(
        Contacts.Store.removeMyContact(publicIdentity.address)
      )
    } else {
      const myContact = {
        metaData: {
          ...metaData,
          addedAt: Date.now(),
          addedBy: Wallet.getSelectedIdentity(PersistentStore.store.getState())
            .identity.address,
        },
        publicIdentity,
      } as Contact

      PersistentStore.store.dispatch(Contacts.Store.addContact(myContact))
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  contacts: Contacts.getContacts(state),
})

export default connect(mapStateToProps)(IdentityView)
