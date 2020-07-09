import * as sdk from '@kiltprotocol/sdk-js'
import * as Claims from '../state/ducks/Claims'
import persistentStore from '../state/PersistentStore'

class RequestForAttestationService {
  public static saveInStore(
    requestForAttestation: sdk.IRequestForAttestation
  ): void {
    persistentStore.store.dispatch(
      Claims.Store.addRequestForAttestation(requestForAttestation)
    )
  }
}

export default RequestForAttestationService
