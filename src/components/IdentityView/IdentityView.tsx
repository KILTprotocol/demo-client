import * as React from 'react'
import { connect } from 'react-redux'

import ContactRepository from '../../services/ContactRepository'
import errorService from '../../services/ErrorService'
import { notifySuccess } from '../../services/FeedbackService'
import * as Balances from '../../state/ducks/Balances'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import Mail from '../Mail/Mail'
import Modal, { ModalType } from '../Modal/Modal'

import './IdentityView.scss'
import MessageRepository from '../../services/MessageRepository'

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

type State = {
  requestKiltTokens: boolean
}

class IdentityView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      requestKiltTokens: false,
    }

    this.registerContact = this.registerContact.bind(this)
    this.toggleContacts = this.toggleContacts.bind(this)
    this.openRequestKiltTokensModal = this.openRequestKiltTokensModal.bind(this)
    this.closeRequestKiltTokensModal = this.closeRequestKiltTokensModal.bind(
      this
    )
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
    const { requestKiltTokens } = this.state

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
              onClick={this.openRequestKiltTokensModal}
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

        {!(balance > 0) && requestKiltTokens && (
          <Modal
            type={ModalType.ALERT}
            header={`Request tokens`}
            showOnInit={true}
            onConfirm={this.closeRequestKiltTokensModal}
            onCancel={this.closeRequestKiltTokensModal}
          >
            <div className="instruction">
              To use all features of the Demo Client you will need write access
              to the Testnet (Mash Net Blockchain). For this you will need Mash
              Coins.
              <br />
              <strong>Please note:</strong>
              <span> the Mash Coins are </span>
              <strong>NOT</strong>
              <span>
                {' '}
                KILT Coins. Mash Coins have no value and are pure play money.
                You can receive 500 Mash Coins for free by sending us an E-Mail
                with the following content:
              </span>
            </div>
            <div className="mailContent">
              <div className="receiver">
                <label>Receiver:</label>
                <div>
                  <Mail
                    mail={
                      process.env.REACT_APP_KILT_TOKEN_REQUEST_EMAIL as string
                    }
                  />
                </div>
              </div>
              <div className="subject">
                <label>Subject:</label>
                <div>Kilt token request for {myIdentity.identity.address}</div>
              </div>
              <div className="body">
                <label>Body:</label>
                <div>
                  Dear KILT Support,
                  <br />
                  <br />
                  I would like to have 500 Mash Coins so that I could try out
                  the Mash-net of the KILT Protocol.
                  <br />
                  <br />
                  Please send me the tokens to my address:
                  <br />
                  <br />
                  {myIdentity.identity.address}
                  <br />
                  <br />I hereby consent, that the KILT Team at BOTLabs GmbH,
                  Keithstr. 2-4, 10787 Berlin, Germany, may contact me
                  occasionally via E-Mail. I understand, that BOTLabs will store
                  my name, organisation and my E-Mail address in a database
                  located in Germany. I can withdraw this consent at any time
                  via E-Mail to{' '}
                  <Mail mail={'info@botlabs.org'} mailTo={false} />.
                  <br />
                  <br />
                  Thank you!
                </div>
              </div>
            </div>
          </Modal>
        )}
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
        serviceAddress: `${MessageRepository.URL}`,
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

  private openRequestKiltTokensModal() {
    this.setState({
      requestKiltTokens: true,
    })
  }

  private closeRequestKiltTokensModal() {
    this.setState({
      requestKiltTokens: false,
    })
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
