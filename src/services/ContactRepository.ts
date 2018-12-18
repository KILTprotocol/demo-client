import { Contact } from '../components/contacts/Contact'
import { BasePostParams } from './BaseRepository'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class ContactRepository {
  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/contacts`

  public async findAll(): Promise<Contact[]> {
    return fetch(`${ContactRepository.URL}`).then(response => response.json())
  }

  public async add(contact: Contact): Promise<Contact> {
    return fetch(`${ContactRepository.URL}`, {
      ...BasePostParams,
      body: JSON.stringify(contact),
    }).then(response => response.json())
  }
}

export default new ContactRepository()
