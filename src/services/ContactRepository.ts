import { Contact } from '../types/Contact'
import { BasePostParams } from './BaseRepository'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class ContactRepository {
  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/contacts`

  private contacts: Contact[] = []

  public async findAll(): Promise<Contact[]> {
    return fetch(`${ContactRepository.URL}`)
      .then(response => response.json())
      .then((contacts: Contact[]) => {
        this.contacts = contacts
        return contacts
      })
  }

  public findByAddress(address: string): Contact | undefined {
    return this.contacts.find(
      (contact: Contact) => contact.publicIdentity.address === address
    )
  }

  public async add(contact: Contact): Promise<Response> {
    return fetch(`${ContactRepository.URL}`, {
      ...BasePostParams,
      body: JSON.stringify(contact),
    })
  }
}

export default new ContactRepository()
