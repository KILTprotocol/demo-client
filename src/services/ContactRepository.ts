import { Contact } from '../types/Contact'
import { BasePostParams } from './BaseRepository'
import ErrorService from './ErrorService'

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class ContactRepository {
  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/contacts`

  public async findAll(): Promise<Contact[]> {
    return fetch(`${ContactRepository.URL}`)
      .then(response => response.json())
      .catch(error => {
        ErrorService.log({
          error,
          message: `Could not resolve contacts'`,
          origin: 'ContactRepository.findAll()',
          type: 'ERROR.FETCH.GET',
        })
        throw new Error()
      })
  }

  public findByAddress(address: string): Promise<Contact> {
    return fetch(`${ContactRepository.URL}/${address}`)
      .then(response => response.json())
      .catch(error => {
        ErrorService.log({
          error,
          message: `Could not resolve contact with address '${address}'`,
          origin: 'ContactRepository.findByAddress()',
          type: 'ERROR.FETCH.GET',
        })
        throw new Error()
      })
  }

  public async add(contact: Contact): Promise<Response> {
    return fetch(`${ContactRepository.URL}`, {
      ...BasePostParams,
      body: JSON.stringify(contact),
    }).catch(error => {
      ErrorService.log({
        error,
        message: `Could not add contact`,
        origin: 'ContactRepository.add()',
        type: 'ERROR.FETCH.POST',
      })
      throw new Error()
    })
  }
}

export default new ContactRepository()
