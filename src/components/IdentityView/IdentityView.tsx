import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import BN from 'bn.js'
import ContactRepository from '../../services/ContactRepository'
import * as Balances from '../../state/ducks/Balances'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import DidDocumentView from '../../containers/DidDocumentView/DidDocumentView'
import {
  persistentStoreInstance,
  State as ReduxState,
} from '../../state/PersistentStore'
import { IContact, IMyIdentity } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

import './IdentityView.scss'
import MessageRepository from '../../services/MessageRepository'
import QRCodePublicIdentity from '../QRCodePublicIdentity/QRCodePublicIdentity'

type StateProps = {
  contacts: IContact[]
}

type OwnProps = {
  // input
  myIdentity: IMyIdentity
  selected: boolean
  // output
  onDelete?: (address: IMyIdentity['identity']['address']) => void
  onSelect?: (seedAsHex: IMyIdentity['identity']['address']) => void
  onCreateDid?: (identity: IMyIdentity) => void
  onDeleteDid?: (identity: IMyIdentity) => void
}

type Props = StateProps & OwnProps

type State = {
  showPublicIdentityQRCode: boolean
}

const FAUCET_URL = window._env_.REACT_APP_FAUCET_URL

class IdentityView extends React.Component<Props, State> {
  private static openKiltFaucet(address: IMyIdentity['identity']['address']) {
    return () => {
      window.open(`${FAUCET_URL}?${address}`, '_blank')
    }
  }

  constructor(props: Props) {
    super(props)
    this.toggleContacts = this.toggleContacts.bind(this)
    this.state = {
      showPublicIdentityQRCode: false,
    }
    this.togglePublicIdentityQRCode = this.togglePublicIdentityQRCode.bind(this)
  }

  private togglePublicIdentityQRCode(): void {
    const { showPublicIdentityQRCode } = this.state
    this.setState({
      showPublicIdentityQRCode: !showPublicIdentityQRCode,
    })
  }

  private toggleContacts(): void {
    const { contacts, myIdentity } = this.props
    let contact = contacts.find(
      (myContact: IContact) =>
        myContact.publicIdentity.address === myIdentity.identity.address
    )

    if (!contact) {
      contact = ContactRepository.getContactFromIdentity(myIdentity, {
        unregistered: true,
      })
    }

    const { metaData, publicIdentity } = contact

    if (contact.metaData.addedAt) {
      persistentStoreInstance.store.dispatch(
        Contacts.Store.removeMyContact(publicIdentity.address)
      )
    } else {
      const myContact = {
        metaData: {
          ...metaData,
          addedAt: Date.now(),
          addedBy: Wallet.getSelectedIdentity(
            persistentStoreInstance.store.getState()
          )?.identity.address,
        },
        publicIdentity,
      } as IContact

      persistentStoreInstance.store.dispatch(
        Contacts.Store.addContact(myContact)
      )
    }
  }

  public render(): JSX.Element {
    const {
      contacts,
      myIdentity,
      selected,
      onDelete,
      onSelect,
      onCreateDid,
      onDeleteDid,
    } = this.props
    const { showPublicIdentityQRCode } = this.state
    const { metaData, phrase, did, identity } = myIdentity
    const contact: IContact | undefined = contacts.find(
      (myContact: IContact) =>
        myContact.publicIdentity.address === myIdentity.identity.address
    )

    let balance = new BN(0)
    if (contact) {
      balance =
        Balances.getBalance(
          persistentStoreInstance.store.getState(),
          contact.publicIdentity.address
        ) || balance
    }
    const classes = ['IdentityView', selected ? 'selected' : '']
    const publicIdentityWithServiceAddress = {
      ...identity.getPublicIdentity(),
      serviceAddress: MessageRepository.URL,
    }
    const togglePublicIdentityQRCodeButtonTxt = `${
      showPublicIdentityQRCode ? 'Hide' : 'Show'
    } QR Code`
    return (
      <section className={classes.join(' ')}>
        {selected && <h2>Active identity</h2>}
        <ContactPresentation address={identity.address} size={50} />
        <div className="attributes">
          <div>
            <label>Alias</label>
            <div>{metaData.name}</div>
          </div>
          <div>
            <label>Phrase</label>
            <div>{phrase}</div>
          </div>
          <div>
            <label>KILT Address</label>
            <div>{identity.address}</div>
          </div>
          <div>
            <label>Seed (as hex)</label>
            <div>{identity.seedAsHex}</div>
          </div>
          <div>
            <label>Public Key</label>
            <div>{identity.signPublicKeyAsHex}</div>
          </div>
          <div>
            <label>Encryption Public Key</label>
            <div>{identity.getBoxPublicKey()}</div>
          </div>
          <div>
            <label>Public identity (scan to send a message)</label>
            <div>
              <div>
                <button
                  type="button"
                  className="QRCodeToggle"
                  onClick={this.togglePublicIdentityQRCode}
                >
                  {togglePublicIdentityQRCodeButtonTxt}
                </button>
                {showPublicIdentityQRCode && (
                  <div className="QRCode">
                    <QRCodePublicIdentity
                      publicIdentity={publicIdentityWithServiceAddress}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label>{myIdentity.did ? 'DID Document' : 'DID'}</label>
            <div>
              {did?.document ? (
                <span className="did">
                  <DidDocumentView didDocument={did.document}>
                    {did.identifier}
                  </DidDocumentView>
                </span>
              ) : (
                <>
                  <div>No DID is attached to this identity.</div>
                </>
              )}
            </div>
          </div>
        </div>
        <span className="actions" />
        <div className="actions">
          {onCreateDid && !did && (
            <button
              type="button"
              title="Generate DID..."
              onClick={onCreateDid.bind(this, myIdentity)}
            >
              Register DID
            </button>
          )}
          {onDeleteDid && did && (
            <button
              type="button"
              title="Delete DID"
              onClick={onDeleteDid.bind(this, myIdentity)}
            >
              Delete DID
            </button>
          )}
          <button
            type="button"
            className={`toggleContacts ${
              contact && contact.metaData.addedAt
                ? 'isMyContact'
                : 'isNotMyContact'
            }`}
            onClick={this.toggleContacts}
            title={
              contact && contact.metaData.addedAt
                ? 'Remove from Favourite Contact'
                : 'Add to Favourite Contact'
            }
          >
            {contact && contact.metaData.addedAt
              ? 'Unfavourize Contact'
              : 'Favourize Contact'}
          </button>
          <span />
        </div>
        <div className="actions">
          {!selected && (
            <>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete.bind(this, myIdentity.identity.address)}
                  disabled={selected}
                >
                  Remove
                </button>
              )}
              {onSelect && (
                <button
                  type="button"
                  onClick={onSelect.bind(this, myIdentity.identity.address)}
                  disabled={selected}
                >
                  Select
                </button>
              )}
            </>
          )}

          {balance && !balance.ltn(0) && (
            <button
              type="button"
              className="requestTokens"
              onClick={IdentityView.openKiltFaucet(myIdentity.identity.address)}
              title="Request Tokens"
            >
              Request Tokens
            </button>
          )}
        </div>
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, OwnProps, ReduxState> = (
  state
) => ({
  contacts: Contacts.getContacts(state),
})

export default connect(mapStateToProps)(IdentityView)
