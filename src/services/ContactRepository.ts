import { PublicIdentity } from '@kiltprotocol/sdk-js'
import * as Contacts from '../state/ducks/Contacts'
import * as Wallet from '../state/ducks/Wallet'
import PersistentStore from '../state/PersistentStore'
import { IContact, IMyIdentity } from '../types/Contact'
import { BasePostParams } from './BaseRepository'
import ErrorService from './ErrorService'
import { notifyFailure } from './FeedbackService'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class ContactRepository {
  public static readonly URL = `${window._env_.REACT_APP_SERVICE_HOST}/contacts`

  public static findByAddress(address: string): IContact | null {
    const persistedContact = Contacts.getContact(
      PersistentStore.store.getState(),
      address
    )

    if (persistedContact) {
      return persistedContact
    }
    return null
  }

  public static async add(contact: IContact): Promise<void> {
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
    myIdentity: IMyIdentity,
    mergeMetaData?: Partial<IContact['metaData']>
  ): IContact {
    const { identity, metaData } = myIdentity

    const contact: IContact = {
      metaData: { ...metaData, ...mergeMetaData },
      publicIdentity: identity.getPublicIdentity(),
    }

    return contact
  }

  public static async importViaDID(
    identifier: string,
    alias: string
  ): Promise<void | IContact> {
    const publicIdentity = await PublicIdentity.resolveFromDid(
      identifier.trim(),
      {
        resolve: (url: string) => {
          // TODO: build/use correct resolver
          return fetch(url)
            .then(response => response.json())
            .then(response => response.did)
        },
      }
    )

    if (publicIdentity) {
      const selectedIdentity = Wallet.getSelectedIdentity(
        PersistentStore.store.getState()
      )
      const contact = {
        did: { identifier },
        metaData: {
          addedAt: Date.now(),
          addedBy: selectedIdentity.identity.address,
          name: alias,
        },
        publicIdentity,
      }
      PersistentStore.store.dispatch(Contacts.Store.addContact(contact))
      return contact
    }
    notifyFailure(`No contact for DID '${identifier}' found.`)
    return Promise.reject()
  }
}

export default ContactRepository
