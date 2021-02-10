import {
  AttestedClaim,
  IAttestedClaim,
  IClaim,
  IDelegationNode,
  Identity,
  IQuoteAgreement,
  IQuoteAttesterSigned,
  RequestForAttestation,
} from '@kiltprotocol/sdk-js'
import { Crypto } from '@kiltprotocol/utils'
import * as Quotes from '../state/ducks/Quotes'
import { persistentStoreInstance } from '../state/PersistentStore'
import ErrorService from './ErrorService'

class QuoteServices {
  public static saveAgreedQuoteInStore(
    quoteEntry: Quotes.QuoteEntry,
    ownerAddress: string
  ): void {
    persistentStoreInstance.store.dispatch(
      Quotes.Store.saveAgreedQuote(quoteEntry, ownerAddress)
    )
  }

  public static createAgreedQuote(
    claim: IClaim,
    identity: Identity,
    terms: AttestedClaim[] = [],
    delegationId?: IDelegationNode['id'],
    quoteAttesterSigned: IQuoteAttesterSigned | null = null
  ): IQuoteAgreement | null {
    if (!quoteAttesterSigned) return null
    const requestForAttestation = RequestForAttestation.fromClaimAndIdentity(
      claim,
      identity,
      {
        legitimations: (terms || []).map((legitimation: IAttestedClaim) =>
          AttestedClaim.fromAttestedClaim(legitimation)
        ),
        delegationId,
      }
    )

    const signature = identity.signStr(
      Crypto.hashObjectAsStr(quoteAttesterSigned)
    )

    const quoteAgreement: IQuoteAgreement = {
      ...quoteAttesterSigned,
      rootHash: requestForAttestation.rootHash,
      claimerSignature: signature,
    }

    try {
      QuoteServices.saveAgreedQuoteInStore(quoteAgreement, identity.address)
    } catch (error) {
      ErrorService.log({
        error,
        message: 'Error storing Agreed Quote',
        origin: 'QuoteServices.agreedQuote()',
        type: 'ERROR.FETCH.POST',
      })
      throw error
    }
    return quoteAgreement
  }
}

export default QuoteServices
