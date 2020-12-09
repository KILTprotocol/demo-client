import { IRequestForAttestation } from '@kiltprotocol/sdk-js'
import * as Claims from '../state/ducks/Claims'
import persistentStore from '../state/PersistentStore'
import { IContact } from '../types/Contact'

class RequestForAttestationService {
  public static saveInStore(
    requestForAttestation: IRequestForAttestation,
    attesterAddress: IContact['publicIdentity']['address']
  ): void {
    persistentStore.store.dispatch(
      Claims.Store.addRequestForAttestation(
        requestForAttestation,
        attesterAddress
      )
    )
  }
}

export default RequestForAttestationService
