import * as sdk from '@kiltprotocol/sdk-js'
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
    claim: sdk.IClaim,
    identity: sdk.Identity,
    terms: sdk.AttestedClaim[] = [],
    delegationId?: sdk.IDelegationNode['id'],
    quoteAttesterSigned: sdk.IQuoteAttesterSigned | null = null
  ): Promise<sdk.IQuoteAgreement | null> {
    if (!quoteAttesterSigned) return null
    const {
      message: requestForAttestation,
    } = await sdk.RequestForAttestation.fromClaimAndIdentity(claim, identity, {
      legitimations: (terms || []).map((legitimation: sdk.IAttestedClaim) =>
        sdk.AttestedClaim.fromAttestedClaim(legitimation)
      ),
      delegationId,
    })

    const signature = identity.signStr(
      sdk.Crypto.hashObjectAsStr(quoteAttesterSigned)
    )

    const quoteAgreement: sdk.IQuoteAgreement = {
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
