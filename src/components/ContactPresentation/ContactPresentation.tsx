import * as sdk from '@kiltprotocol/prototype-sdk'
import Identicon from '@polkadot/ui-identicon'
import _ from 'lodash'
import * as React from 'react'

import ContactRepository from '../../services/ContactRepository'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import SelectAction, { Action } from '../SelectAction/SelectAction'

import './ContactPresentation.scss'

type Props = {
  address?: sdk.IPublicIdentity['address']
  contact?: Contact
  inline?: true
  interactive?: true
  iconOnly?: boolean
  myIdentity?: MyIdentity
  size?: number
}

type State = {
  address?: sdk.IPublicIdentity['address']
  contact?: Contact
  myIdentity?: MyIdentity
}

const DEFAULT_SIZE = 24

class ContactPresentation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.import = this.import.bind(this)
    this.remove = this.remove.bind(this)
  }

  public componentDidMount() {
    this.setIdentityOrContact()
  }

  public componentDidUpdate(prevProps: Props) {
    if (!_.isEqual(this.props, prevProps)) {
      this.setIdentityOrContact()
    }
  }

  public render() {
    const { inline, interactive, iconOnly, size } = this.props
    const { address, contact, myIdentity } = this.state

    const name = myIdentity
      ? myIdentity.metaData.name
      : contact && contact.metaData
      ? contact.metaData.name
      : address
      ? address.substr(0, 20)
      : '-'

    let actions: Action[] = []

    if (interactive) {
      actions = this.getActions()
    }

    const classes = [
      'ContactPresentation',
      inline ? 'inline' : '',
      contact ? (!contact.metaData.addedAt ? 'external' : 'internal') : '',
      actions.length ? 'withActions' : '',
    ]

    return (
      <div className={classes.join(' ')}>
        <Identicon
          value={address}
          size={size || DEFAULT_SIZE}
          theme="substrate"
        />
        {!iconOnly && (
          <span className="label">
            {name}
            {myIdentity && <small>(me)</small>}
          </span>
        )}
        {!!actions.length && (
          <SelectAction className="minimal" actions={actions} />
        )}
      </div>
    )
  }

  private getActions(): Action[] {
    const { contact } = this.state
    const actions: Action[] = []

    if (contact && !contact.metaData.addedAt) {
      actions.push({
        callback: this.import,
        label: 'Import',
      })
    }

    if (contact && contact.metaData.addedAt) {
      actions.push({
        callback: this.remove,
        label: 'Remove',
      })
    }

    return actions
  }

  private setIdentityOrContact() {
    const { address, myIdentity, contact } = this.props

    if (myIdentity) {
      this.setMyIdentity(myIdentity)
    } else if (contact) {
      this.setContact(contact)
    } else if (address) {
      const _myIdentity: MyIdentity | undefined = Wallet.getIdentity(
        PersistentStore.store.getState(),
        address
      )
      if (_myIdentity) {
        this.setMyIdentity(_myIdentity)
      } else {
        ContactRepository.findByAddress(address)
          .then((_contact: Contact) => {
            this.setContact(_contact)
          })
          .catch(() => {
            this.setAddress(address)
          })
      }
    } else {
      this.setAddress()
    }
  }

  private setMyIdentity(myIdentity: MyIdentity) {
    this.setState({
      address: myIdentity.identity.address,
      contact: undefined,
      myIdentity,
    })
    ContactRepository.findByAddress(myIdentity.identity.address).then(
      (contact: Contact) => {
        this.setState({ contact })
      }
    )
  }

  private setContact(contact: Contact) {
    this.setState({
      address: contact.publicIdentity.address,
      contact,
      myIdentity: Wallet.getIdentity(
        PersistentStore.store.getState(),
        contact.publicIdentity.address
      ),
    })
  }

  private setAddress(address?: sdk.PublicIdentity['address']) {
    this.setState({
      address,
      contact: undefined,
      myIdentity: undefined,
    })
  }

  private import() {
    const { contact } = this.state

    const selectedIdentity = Wallet.getSelectedIdentity(
      PersistentStore.store.getState()
    )

    if (contact) {
      const { metaData, publicIdentity } = contact

      const myContact = {
        metaData: {
          ...metaData,
          addedAt: Date.now(),
          addedBy: selectedIdentity.identity.address,
        },
        publicIdentity,
      }
      PersistentStore.store.dispatch(Contacts.Store.addContact(myContact))
      this.setState({
        contact: myContact,
      })
    }
  }

  private remove() {
    const { address } = this.state

    if (address) {
      PersistentStore.store.dispatch(Contacts.Store.removeContact(address))
    }
  }
}

export default ContactPresentation
