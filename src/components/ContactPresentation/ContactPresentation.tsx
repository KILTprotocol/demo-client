import * as sdk from '@kiltprotocol/sdk-js'
import Identicon from '@polkadot/ui-identicon'
import _ from 'lodash'
import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RequestAcceptDelegationProps } from '../../containers/Tasks/RequestAcceptDelegation/RequestAcceptDelegation'
import { RequestTermsProps } from '../../containers/Tasks/RequestTerms/RequestTerms'
import { SubmitTermsProps } from '../../containers/Tasks/SubmitTerms/SubmitTerms'

import ContactRepository from '../../services/ContactRepository'
import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { IContact, IMyIdentity } from '../../types/Contact'
import SelectAction, { Action } from '../SelectAction/SelectAction'

import './ContactPresentation.scss'

type StateProps = {
  contacts: IContact[]
}

type OwnProps = {
  address: sdk.IPublicIdentity['address']

  iconOnly?: boolean
  inline?: true
  interactive?: true
  size?: number
  fullSizeActions?: true
  right?: true
}

type Props = StateProps & OwnProps

type State = {
  contact?: IContact
  myIdentity?: IMyIdentity
}

const DEFAULT_SIZE = 24

class ContactPresentation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.import = this.import.bind(this)
    this.remove = this.remove.bind(this)
  }

  public componentDidMount(): void {
    this.setContact()
    this.setMyIdentity()
  }

  public componentDidUpdate(prevProps: Props): void {
    if (!_.isEqual(this.props, prevProps)) {
      this.setContact()
      this.setMyIdentity()
    }
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
            props: { cTypeHashes: [null], receiverAddresses: [address] },
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
            } as RequestTermsProps,
          })
        )
      },
      label: 'Request Terms',
    })

    actions.push({
      callback: () => {
        PersistentStore.store.dispatch(
          UiState.Store.updateCurrentTaskAction({
            objective: sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES_CLASSIC,
            props: {
              cTypeHashes: [null],
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
            } as SubmitTermsProps,
          })
        )
      },
      label: 'Submit Terms',
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

  private setContact(): void {
    const { address } = this.props

    ContactRepository.findByAddress(address).then((contact: IContact) => {
      if (contact) {
        this.setState({ contact })
      }
    })
  }

  private setMyIdentity(): void {
    const { address } = this.props

    const myIdentity: IMyIdentity = Wallet.getIdentity(
      PersistentStore.store.getState(),
      address
    )

    this.setState({ myIdentity })
  }

  private import(): void {
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
          addedBy: selectedIdentity.identity.getAddress(),
        },
        publicIdentity,
      }
      PersistentStore.store.dispatch(Contacts.Store.addContact(myContact))
      this.setState({
        contact: myContact,
      })
    }
  }

  private remove(): void {
    const { address } = this.props

    if (address) {
      PersistentStore.store.dispatch(Contacts.Store.removeMyContact(address))
    }
  }

  public render(): JSX.Element {
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

    let name = '-'

    if (contact && contact.metaData) {
      name = contact.metaData.name
    } else if (myIdentity) {
      name = myIdentity.metaData.name
    } else if (address) {
      name = address.substr(0, 20)
    }

    let actions: Action[] = []

    if (interactive) {
      actions = this.getActions()
    }

    let contactClass = ''
    if (contact) {
      if (contact.metaData.addedAt) {
        contactClass = 'internal'
      } else {
        contactClass = 'external'
      }
    }

    const classes = [
      'ContactPresentation',
      inline ? 'inline' : '',
      contactClass,
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
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  contacts: Contacts.getContacts(state),
})

export default connect(mapStateToProps)(ContactPresentation)
