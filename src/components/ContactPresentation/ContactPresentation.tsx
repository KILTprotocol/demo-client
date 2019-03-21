import * as sdk from '@kiltprotocol/prototype-sdk'
import Identicon from '@polkadot/ui-identicon'
import * as React from 'react'

import ContactRepository from '../../services/ContactRepository'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'

import './ContactPresentation.scss'

type Props = {
  address?: sdk.IPublicIdentity['address']
  contact?: Contact
  inline?: true
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
  }

  public componentDidMount() {
    this.setIdentityOrContact()
  }

  public componentDidUpdate(nextProps: Props) {
    if (this.havePropsChanged(nextProps)) {
      this.setIdentityOrContact()
    }
  }

  public render() {
    const { inline, iconOnly, size } = this.props
    const { address, contact, myIdentity } = this.state

    const name = myIdentity
      ? myIdentity.metaData.name
      : contact && contact.metaData
      ? contact.metaData.name
      : address
      ? address.substr(0, 20)
      : '-'

    const classes = ['ContactPresentation', inline ? 'inline' : '']

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
      </div>
    )
  }

  private havePropsChanged(nextProps: Props) {
    switch (true) {
      case nextProps.address !== this.props.address:
      case nextProps.contact && !this.props.contact:
      case !nextProps.contact && this.props.contact:
      case nextProps.contact &&
        this.props.contact &&
        nextProps.contact.publicIdentity.address !==
          this.props.contact.publicIdentity.address:
        return true
      default:
        return false
    }
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
  }

  private setContact(contact: Contact) {
    this.setState({
      address: contact.publicIdentity.address,
      contact,
      myIdentity: undefined,
    })
  }

  private setAddress(address?: sdk.PublicIdentity['address']) {
    this.setState({
      address,
      contact: undefined,
      myIdentity: undefined,
    })
  }
}

export default ContactPresentation
