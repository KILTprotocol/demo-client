import Immutable from 'immutable'
import { createSelector } from 'reselect'
import KiltAction from '../../types/Action'
import { Contact, MyIdentity } from '../../types/Contact'
import { State as ReduxState } from '../PersistentStore'

interface AddAction extends KiltAction {
  payload: Contact
}

interface RemoveAction extends KiltAction {
  payload: Contact['publicIdentity']['address']
}

type Action = AddAction | RemoveAction

type State = {
  contacts: Immutable.Map<Contact['publicIdentity']['address'], Contact>
}

type SerializedState = {
  contacts: string[]
}

type ImmutableState = Immutable.Record<State>

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const contacts = state
      .get('contacts')
      .toList()
      .filter((contact: Contact) => contact.metaData.addedAt)
      .map((contact: Contact) => {
        return JSON.stringify(contact)
      })
      .toArray()

    return { contacts }
  }

  public static deserialize(serializedState: SerializedState): ImmutableState {
    let contactsArray: Contact[]
    const contacts: { [address: string]: Contact } = {}

    try {
      contactsArray = serializedState.contacts.map((serialized: string) => {
        return JSON.parse(serialized) as Contact
      })
    } catch (e) {
      contactsArray = []
    }

    contactsArray.forEach((contact: Contact) => {
      const { address } = contact.publicIdentity
      contacts[address] = contact
    })

    return Store.createState({ contacts: Immutable.Map(contacts) })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.ADD_CONTACT: {
        const contact = (action as AddAction).payload
        const { publicIdentity } = contact
        return state.setIn(['contacts', publicIdentity.address], contact)
      }
      case Store.ACTIONS.REMOVE_CONTACT: {
        const address = (action as RemoveAction).payload

        const contact = state.getIn(['contacts', address])
        const { metaData, publicIdentity } = contact

        delete metaData.addedAt
        delete metaData.addedBy

        return state.setIn(['contacts', address], {
          metaData: { ...metaData },
          publicIdentity,
        })
      }
      default:
        return state
    }
  }

  public static addContact(contact: Contact): AddAction {
    return {
      payload: contact,
      type: Store.ACTIONS.ADD_CONTACT,
    }
  }

  public static removeContact(
    address: MyIdentity['identity']['address']
  ): RemoveAction {
    return {
      payload: address,
      type: Store.ACTIONS.REMOVE_CONTACT,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      contacts: Immutable.Map<Contact['publicIdentity']['address'], Contact>(),
    } as State)(obj)
  }

  private static ACTIONS = {
    ADD_CONTACT: 'contacts/ADD_CONTACT',
    REMOVE_CONTACT: 'contacts/REMOVE_CONTACT',
  }
}

const _getContacts = (state: ReduxState) => {
  return state.contacts
    .get('contacts')
    .toList()
    .toArray()
}

const getContacts = createSelector(
  [_getContacts],
  (contacts: Contact[]) => contacts
)

const getMyContacts = createSelector(
  [getContacts],
  (contacts: Contact[]) =>
    contacts.filter((contact: Contact) => contact.metaData.addedAt)
)

const _getContact = (
  state: ReduxState,
  address: Contact['publicIdentity']['address']
) => state.contacts.get('contacts').get(address)

const getContact = createSelector(
  [_getContact],
  (contact: Contact) => contact
)

export {
  Store,
  ImmutableState,
  SerializedState,
  Action,
  getContacts,
  getContact,
  getMyContacts,
}
