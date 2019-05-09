import * as Contacts from '../state/ducks/Contacts'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import { Contact, MyIdentity } from '../types/Contact'
import { BasePostParams } from './BaseRepository'
import ErrorService from './ErrorService'
import { notifyFailure } from './FeedbackService'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class ContactRepository {
  public static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/contacts`

  public static async findAll(): Promise<Contact[]> {
    return fetch(`${ContactRepository.URL}`)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        return response
      })
      .then(response => response.json())
      .then((contacts: Contact[]) => {
        PersistentStore.store.dispatch(Contacts.Store.addContacts(contacts))
        return Contacts.getContacts(PersistentStore.store.getState())
      })
      .catch(error => {
        ErrorService.log({
          error,
          message: `Could not resolve contacts'`,
          origin: 'ContactRepository.findAll()',
          type: 'ERROR.FETCH.GET',
        })
        return error
      })
  }

  public static async findByAddress(
    address: string,
    propagateError = false
  ): Promise<void | Contact> {
    const persistedContact = Contacts.getContact(
      PersistentStore.store.getState(),
      address
    )

    if (persistedContact) {
      return persistedContact
    }

    return fetch(`${ContactRepository.URL}/${address}`)
      .then(response => {
        if (!response.ok) {
          throw Error(address)
        }
        return response
      })
      .then(response => response.json())
      .then((contact: Contact) => {
        PersistentStore.store.dispatch(Contacts.Store.addContact(contact))
        return contact
      })
      .catch(error => {
        if (!Wallet.getIdentity(PersistentStore.store.getState(), address)) {
          notifyFailure(
            `Could not resolve contact for address ${address}!`,
            false
          )
        }
        if (propagateError) {
          throw error
        }
      })
  }

  public static async add(contact: Contact): Promise<void> {
    return fetch(`${ContactRepository.URL}`, {
      ...BasePostParams,
      body: JSON.stringify(contact),
    })
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        return response
      })
      .then(() => {
        PersistentStore.store.dispatch(Contacts.Store.addContact(contact))
      })
      .catch(error => {
        ErrorService.log({
          error,
          message: `Could not add contact`,
          origin: 'ContactRepository.add()',
          type: 'ERROR.FETCH.POST',
        })
      })
  }

  public static getContactFromIdentity(
    myIdentity: MyIdentity,
    mergeMetaData?: Partial<Contact['metaData']>
  ) {
    const { identity, metaData } = myIdentity
    const { address, boxPublicKeyAsHex } = identity

    const contact: Contact = {
      metaData: { ...metaData, ...mergeMetaData },
      publicIdentity: { address, boxPublicKeyAsHex },
    }

    return contact
  }
}

export default ContactRepository
