import Immutable from 'immutable'
import { createSelector } from 'reselect'

import KiltAction from '../../types/Action'
import { IContact } from '../../types/Contact'
import { State as ReduxState } from '../PersistentStore'

interface IAddContactAction extends KiltAction {
  payload: IContact
}

interface IAddContactsAction extends KiltAction {
  payload: IContact[]
}

interface IRemoveContactAction extends KiltAction {
  payload: IContact['publicIdentity']['address']
}

export type Action =
  | IAddContactAction
  | IAddContactsAction
  | IRemoveContactAction

type State = {
  contacts: Immutable.Map<IContact['publicIdentity']['address'], IContact>
}

export type SerializedState = {
  contacts: string[]
}

export type ImmutableState = Immutable.Record<State>

const arrayToMap = (
  contactsArray: IContact[]
): Immutable.Map<IContact['publicIdentity']['address'], IContact> => {
  const contacts: { [address: string]: IContact } = {}
  contactsArray.forEach((contact: IContact) => {
    const { address } = contact.publicIdentity
    contacts[address] = contact
  })
  return Immutable.Map(contacts)
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const contacts = state
      .get('contacts')
      .toList()
      .filter((contact: IContact) => contact.metaData.addedAt)
      .map((contact: IContact) => {
        return JSON.stringify(contact)
      })
      .toArray()

    return { contacts }
  }

  public static deserialize(serializedState: SerializedState): ImmutableState {
    let contacts: IContact[]

    try {
      contacts = serializedState.contacts.map((serialized: string) => {
        return JSON.parse(serialized) as IContact
      })
    } catch (e) {
      contacts = []
    }

    return Store.createState({ contacts: arrayToMap(contacts) })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.ADD_CONTACT: {
        const contact = (action as IAddContactAction).payload
        const { publicIdentity } = contact
        return state.setIn(['contacts', publicIdentity.address], contact)
      }
      case Store.ACTIONS.ADD_CONTACTS: {
        const contacts = arrayToMap((action as IAddContactsAction).payload)
        const currentContacts = state.getIn(['contacts'])
        return state.setIn(['contacts'], currentContacts.mergeDeep(contacts))
      }
      case Store.ACTIONS.REMOVE_CONTACT: {
        const address = (action as IRemoveContactAction).payload

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

  public static addContact(contact: IContact): IAddContactAction {
    return {
      payload: contact,
      type: Store.ACTIONS.ADD_CONTACT,
    }
  }

  public static addContacts(contacts: IContact[]): IAddContactsAction {
    return {
      payload: contacts,
      type: Store.ACTIONS.ADD_CONTACTS,
    }
  }

  public static removeMyContact(
    address: IContact['publicIdentity']['address']
  ): IRemoveContactAction {
    return {
      payload: address,
      type: Store.ACTIONS.REMOVE_CONTACT,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      contacts: Immutable.Map<
        IContact['publicIdentity']['address'],
        IContact
      >(),
    } as State)(obj)
  }

  private static ACTIONS = {
    ADD_CONTACT: 'contacts/ADD_CONTACT',
    ADD_CONTACTS: 'contacts/ADD_CONTACTS',
    REMOVE_CONTACT: 'contacts/REMOVE_CONTACT',
  }
}

const getStateContacts = (state: ReduxState): IContact[] => {
  return state.contacts.get('contacts').toList().toArray()
}

const getContacts = createSelector(
  [getStateContacts],
  (contacts: IContact[]) => contacts
)

const getMyContacts = createSelector([getContacts], (contacts: IContact[]) =>
  contacts.filter((contact: IContact) => contact.metaData.addedAt)
)

const getStateContact = (
  state: ReduxState,
  address: IContact['publicIdentity']['address']
): IContact | undefined => state.contacts.get('contacts').get(address)

const getContact = createSelector(
  [getStateContact],
  (contact: IContact | undefined) => contact
)

export { Store, getContacts, getContact, getMyContacts }
