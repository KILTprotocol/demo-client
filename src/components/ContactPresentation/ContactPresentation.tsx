import * as sdk from '@kiltprotocol/sdk-js'
import Identicon from '@polkadot/ui-identicon'
import _ from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { RequestAcceptDelegationProps } from '../../containers/Tasks/RequestAcceptDelegation/RequestAcceptDelegation'
import { RequestLegitimationsProps } from '../../containers/Tasks/RequestLegitimation/RequestLegitimation'
import { SubmitLegitimationsProps } from '../../containers/Tasks/SubmitLegitimations/SubmitLegitimations'

import ContactRepository from '../../services/ContactRepository'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { Contact, MyIdentity } from '../../types/Contact'
import SelectAction, { Action } from '../SelectAction/SelectAction'

import './ContactPresentation.scss'

type Props = {
  address: sdk.IPublicIdentity['address']

  iconOnly?: boolean
  inline?: true
  interactive?: true
  size?: number
  fullSizeActions?: true
  right?: true

  // mapStateToProps
  contacts: Contact[]
}

type State = {
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
    this.setContact()
    this.setMyIdentity()
  }

  public componentDidUpdate(prevProps: Props) {
    if (!_.isEqual(this.props, prevProps)) {
      this.setContact()
      this.setMyIdentity()
    }
  }

  public render() {
    const {
      address,
      inline,
      interactive,
      iconOnly,
      fullSizeActions,
      right,
      size,
    } = this.props
    const { contact, myIdentity } = this.state

    const name =
      contact && contact.metaData
        ? contact.metaData.name
        : myIdentity
        ? myIdentity.metaData.name
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
      fullSizeActions ? 'fullSizeActions' : 'minimal',
      right ? 'alignRight' : '',
    ]

    const dataAttributes: { [dataAttribute: string]: string } = {
      'data-address': address,
    }
    if (contact && contact.metaData && contact.metaData.name) {
      dataAttributes['data-name'] = contact.metaData.name
    }

    return (
      <div className={classes.join(' ')} {...dataAttributes}>
        <Identicon
          value={address}
          size={size || DEFAULT_SIZE}
          theme="substrate"
        />
        {!iconOnly && (
          <span className="label" title={name}>
            {name}
            {myIdentity && <small>(me)</small>}
          </span>
        )}
        {!!actions.length && (
          <SelectAction
            className={fullSizeActions ? 'fullSize' : 'minimal'}
            actions={actions}
          />
        )}
      </div>
    )
  }

  private getActions(): Action[] {
    const { address } = this.props
    const { contact } = this.state
    const actions: Action[] = []

    if (contact && !contact.metaData.addedAt) {
      actions.push({
        callback: this.import,
        label: 'Favorize',
      })
    }

    if (contact && contact.metaData.addedAt) {
      actions.push({
        callback: this.remove,
        label: 'Unfavorize',
      })
    }

    actions.push({
      callback: () => {
        PersistentStore.store.dispatch(
          UiState.Store.updateCurrentTaskAction({
            objective: sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES,
            props: {
              receiverAddresses: [address],
            },
          })
        )
      },
      label: 'Request claims',
    })

    actions.push({
      callback: () => {
        PersistentStore.store.dispatch(
          UiState.Store.updateCurrentTaskAction({
            objective: sdk.MessageBodyType.REQUEST_TERMS,
            props: {
              receiverAddresses: [address],
            } as RequestLegitimationsProps,
          })
        )
      },
      label: 'Request legitimations',
    })

    actions.push({
      callback: () => {
        PersistentStore.store.dispatch(
          UiState.Store.updateCurrentTaskAction({
            objective: sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES,
            props: {
              receiverAddresses: [address],
            },
          })
        )
      },
      label: 'Submit claims',
    })

    actions.push({
      callback: () => {
        PersistentStore.store.dispatch(
          UiState.Store.updateCurrentTaskAction({
            objective: sdk.MessageBodyType.SUBMIT_TERMS,
            props: {
              receiverAddresses: [address],
            } as SubmitLegitimationsProps,
          })
        )
      },
      label: 'Submit legitimations',
    })

    actions.push({
      callback: () => {
        PersistentStore.store.dispatch(
          UiState.Store.updateCurrentTaskAction({
            objective: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION,
            props: {
              isPCR: false,
              receiverAddresses: [address],
            } as RequestAcceptDelegationProps,
          })
        )
      },
      label: 'Invite to delegation(s)',
    })

    actions.push({
      callback: () => {
        PersistentStore.store.dispatch(
          UiState.Store.updateCurrentTaskAction({
            objective: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION,
            props: {
              isPCR: true,
              receiverAddresses: [address],
            } as RequestAcceptDelegationProps,
          })
        )
      },
      label: 'Invite to PCR(s)',
    })

    return actions
  }

  private setContact() {
    const { address } = this.props

    ContactRepository.findByAddress(address).then((contact: Contact) => {
      if (contact) {
        this.setState({ contact })
      }
    })
  }

  private setMyIdentity() {
    const { address } = this.props

    const myIdentity: MyIdentity = Wallet.getIdentity(
      PersistentStore.store.getState(),
      address
    )

    this.setState({ myIdentity })
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
    const { address } = this.props

    if (address) {
      PersistentStore.store.dispatch(Contacts.Store.removeMyContact(address))
    }
  }
}

const mapStateToProps = (state: ReduxState) => ({
  contacts: Contacts.getContacts(state),
})

export default connect(mapStateToProps)(ContactPresentation)
