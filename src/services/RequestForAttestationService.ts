import * as sdk from '@kiltprotocol/sdk-js'
import * as Claims from '../state/ducks/Claims'
import persistentStore from '../state/PersistentStore'

class RequestForAttestationService {
  public static saveInStore(
    address: sdk.IPublicIdentity['address'],
    requestForAttestation: sdk.IRequestForAttestation
  ): void {
    persistentStore.store.dispatch(
      Claims.Store.addRequestForAttestation(address, requestForAttestation)
    )
  }
}

export default RequestForAttestationService
