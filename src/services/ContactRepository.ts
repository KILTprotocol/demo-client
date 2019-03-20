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
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        return response
      })
      .then(response => response.json())
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

  public findByAddress(address: string): Promise<Contact> {
    return fetch(`${ContactRepository.URL}/${address}`)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        return response
      })
      .then(response => response.json())
      .catch(error => {
        ErrorService.log({
          error,
          message: `Could not resolve contact with address '${address}'`,
          origin: 'ContactRepository.findByAddress()',
          type: 'ERROR.FETCH.GET',
        })
      })
  }

  public async add(contact: Contact): Promise<Response> {
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
      .catch(error => {
        ErrorService.log({
          error,
          message: `Could not add contact`,
          origin: 'ContactRepository.add()',
          type: 'ERROR.FETCH.POST',
        })
        return error
      })
  }
}

export default new ContactRepository()
