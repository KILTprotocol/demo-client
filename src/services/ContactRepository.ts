import { Contact } from '../types/Contact'
import { BasePostParams } from './BaseRepository'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class ContactRepository {
  public static async findAll(): Promise<Contact[]> {
    return fetch(`${ContactRepository.URL}`).then(response => response.json())
  }

  public static async findByKey(key: string): Promise<Contact> {
    return fetch(`${ContactRepository.URL}/${key}`).then(response =>
      response.json()
    )
  }

  public static async add(contact: Contact): Promise<Response> {
    return fetch(`${ContactRepository.URL}`, {
      ...BasePostParams,
      body: JSON.stringify(contact),
    })
  }

  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/contacts`
}

export default ContactRepository
