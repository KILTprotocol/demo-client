import * as React from 'react'
import { connect } from 'react-redux'

import ContactRepository from '../../services/ContactRepository'
import errorService from '../../services/ErrorService'
import { notifySuccess } from '../../services/FeedbackService'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import * as Balances from '../../state/ducks/Balances'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

import './IdentityView.scss'
import MessageRepository from 'src/services/MessageRepository';

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
    this.requestKiltTokens = this.requestKiltTokens.bind(this)
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

    const contact: Contact | undefined = contacts.find(
      (myContact: Contact) =>
        myContact.publicIdentity.address === myIdentity.identity.address
    )

    let balance: number = 0
    if (contact) {
      balance = Balances.getBalance(
        PersistentStore.store.getState(),
        contact.publicIdentity.address
      )
    }

    const classes = ['IdentityView', selected ? 'selected' : '']

    return (
      <section className={classes.join(' ')}>
        {selected && <h2>Active identity</h2>}
        <ContactPresentation address={myIdentity.identity.address} size={50} />
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

          <button
            className={`toggleContacts ${
              contact && contact.metaData.addedAt
                ? 'isMyContact'
                : 'isNotMyContact'
            }`}
            onClick={this.toggleContacts}
            title={
              contact && contact.metaData.addedAt
                ? 'Remove from my contacts'
                : 'Add to my contacts'
            }
          />

          {!(balance > 0) && (
            <button
              className="requestTokens"
              onClick={this.requestKiltTokens}
              title="Request Tokens"
            >
              Request Tokens
            </button>
          )}

          {(!contact || (contact && contact.metaData.unregistered)) && (
            <button onClick={this.registerContact}>Register</button>
          )}
          <span />
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
      publicIdentity: { 
        address, 
        boxPublicKeyAsHex,
        serviceAddress: `${MessageRepository.URL}`
      },
    }

    ContactRepository.add(contact).then(
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

  private requestKiltTokens() {
    const { myIdentity } = this.props
    const kiltTokenRequestEmail = `${
      process.env.REACT_APP_KILT_TOKEN_REQUEST_EMAIL
    }`
    const subject = `Kilt token request for ${myIdentity.identity.address}`
    const body = `
Dear KILT Support,%0A
%0A
I would like to have 1000 Mash Coins so that I could try out the Mash-net of the KILT Protocol.
%0A
Please send me the tokens to my address:%0A
%0A
${myIdentity.identity.address}%0A
%0A
I hereby consent, that the KILT Team at BOTLabs GmbH, Keithstr. 2-4, 10787 Berlin, Germany, may contact me occasionally via E-Mail. I understand, that BOTLabs will store my name, organisation and my E-Mail address in a database located in Germany. I can withdraw this consent at any time via E-Mail to info@botlabs.org.%0A
%0A
Thank you!
`
    // @ts-ignore
    window.location = `mailto:${kiltTokenRequestEmail}?subject=${subject}&body=${body}`
  }

  private toggleContacts() {
    const { contacts, myIdentity } = this.props

    let contact = contacts.find(
      (myContact: Contact) =>
        myContact.publicIdentity.address === myIdentity.identity.address
    )

    if (!contact) {
      contact = ContactRepository.getContactFromIdentity(myIdentity, {
        unregistered: true,
      })
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
