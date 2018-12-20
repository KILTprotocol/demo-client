import { Message } from '../components/messages/Message'
import {Identity} from "@kiltprotocol/prototype-sdk";
import { BaseDeleteParams, BasePostParams } from './BaseRepository'
import {u8aToHex} from '@polkadot/util';

// TODO: add tests, create interface for this class to be implemented as mock
// (for other tests)

class MessageRepository {
  private static readonly URL = `${process.env.REACT_APP_SERVICE_HOST}:${
    process.env.REACT_APP_SERVICE_PORT
  }/messaging`

  public async findByMessageId(
    messageId: string,
    myIdentity: Identity
  ): Promise<Message> {
    return fetch(
      `${MessageRepository.URL}/inbox/${u8aToHex(myIdentity.signKeyPair.publicKey)}/${messageId}`
    ).then(response => response.json())
  }

  public async findByMyIdentity(myIdentity: Identity): Promise<Message[]> {
    return fetch(
      `${MessageRepository.URL}/inbox/${u8aToHex(myIdentity.signKeyPair.publicKey)}`
    ).then(response => response.json())
  }

  public async findByMyIdentities(
    myIdentities: Identity[]
  ): Promise<Message[]> {
    return Promise.reject('implement')
  }

  public async send(message: Message): Promise<Message> {
    return fetch(`${MessageRepository.URL}`, {
      ...BasePostParams,
      body: JSON.stringify(message),
    }).then(response => response.json())
  }

  public async deleteByMessageId(messageId: string) {
    return fetch(`${MessageRepository.URL}/${messageId}`, {
      ...BaseDeleteParams,
    })
  }
}

export default new MessageRepository()
