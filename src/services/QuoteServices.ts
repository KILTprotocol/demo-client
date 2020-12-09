import {
  Crypto,
  AttestedClaim,
  IAttestedClaim,
  IClaim,
  IDelegationNode,
  Identity,
  IQuoteAgreement,
  IQuoteAttesterSigned,
  RequestForAttestation,
} from '@kiltprotocol/sdk-js'
import * as Quotes from '../state/ducks/Quotes'
import PersistentStore from '../state/PersistentStore'
import ErrorService from './ErrorService'

class QuoteServices {
  public static saveAgreedQuoteInStore(
    quoteEntry: Quotes.QuoteEntry,
    ownerAddress: string
  ): void {
    PersistentStore.store.dispatch(
      Quotes.Store.saveAgreedQuote(quoteEntry, ownerAddress)
    )
  }

  public static async createAgreedQuote(
    claim: IClaim,
    identity: Identity,
    terms: AttestedClaim[] = [],
    delegationId?: IDelegationNode['id'],
    quoteAttesterSigned: IQuoteAttesterSigned | null = null
  ): Promise<IQuoteAgreement | null> {
    if (!quoteAttesterSigned) return null
    const {
      message: requestForAttestation,
    } = await RequestForAttestation.fromClaimAndIdentity(claim, identity, {
      legitimations: (terms || []).map((legitimation: IAttestedClaim) =>
        AttestedClaim.fromAttestedClaim(legitimation)
      ),
      delegationId,
    })

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
