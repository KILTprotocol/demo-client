import Immutable from 'immutable'
import { createSelector } from 'reselect'
import * as sdk from '@kiltprotocol/sdk-js'
import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { State as ReduxState } from '../PersistentStore'
import * as Wallet from './Wallet'
import { IMyIdentity } from '../../types/Contact'

export type IQuoteEntry = sdk.IQuoteAttesterSigned | sdk.IQuoteAgreement // Could find a better name for this

function hash(quote: sdk.IQuote): string {
  const quoteHash = {
    attesterAddress: quote.attesterAddress,
    cTypeHash: quote.cTypeHash,
    cost: quote.cost,
    currency: quote.currency,
    timeframe: quote.timeframe,
    termsAndConditions: quote.termsAndConditions,
  }
  return sdk.Crypto.hashObjectAsStr(JSON.stringify(quoteHash))
}

interface ISaveAction extends KiltAction {
  payload: {
    quoteId: Entry['quoteId']
    claimerAddress: string
    quote: IQuoteEntry
  }
}

interface ISaveAgreedQuoteAction extends KiltAction {
  payload: {
    quoteId: Entry['quoteId']
    quote: IQuoteEntry
  }
}

interface IRemoveAction extends KiltAction {
  payload: sdk.IQuoteAttesterSigned['attesterSignature']
}

export type Action = ISaveAction | IRemoveAction | ISaveAgreedQuoteAction

export type Entry = {
  quoteId: string
  claimerAddress: string
  quote: IQuoteEntry
}

type State = {
  quotes: Immutable.Map<string, Entry>
}

export type ImmutableState = Immutable.Record<State>

export type SerializedState = {
  quotes: Entry[]
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const serialized: SerializedState = {
      quotes: [],
    }

    serialized.quotes = state
      .get('quotes')
      .toList()
      .map((quoteEntry: Entry) => quoteEntry)
      .toArray()
    return serialized
  }

  public static deserialize(
    quoteStateSerialized: SerializedState
  ): ImmutableState {
    if (!quoteStateSerialized) {
      return Store.createState({
        quotes: Immutable.Map(),
      })
    }
    const quoteEntries = {}

    quoteStateSerialized.quotes.forEach(serializedQuote => {
      try {
        const quoteAsJson = JSON.parse(JSON.stringify(serializedQuote))

        const quoteEntry: Entry = {
          quoteId: quoteAsJson.quoteId,
          claimerAddress: quoteAsJson.claimerAddress,
          quote: quoteAsJson.quote,
        }
        quoteEntries[serializedQuote.quoteId] = quoteEntry
      } catch (e) {
        errorService.log({
          error: e,
          message: '',
          origin: 'Quotes.deserialize()',
        })
      }
    })

    return Store.createState({
      quotes: Immutable.Map(quoteEntries),
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.SAVE_QUOTE: {
        const {
          quoteId,
          claimerAddress,
          quote,
        } = (action as ISaveAction).payload

        return state.setIn(['quotes', quoteId], {
          quoteId,
          claimerAddress,
          quote,
        } as Entry)
      }
      case Store.ACTIONS.SAVE_AGREED_QUOTE: {
        const { quoteId, quote } = (action as ISaveAgreedQuoteAction).payload

        return state.setIn(['quotes', quoteId], {
          quoteId,
          quote,
        } as Entry)
      }
      case Store.ACTIONS.REMOVE_QUOTE: {
        return state.deleteIn(['quotes', (action as IRemoveAction).payload])
      }
      default:
        return state
    }
  }

  public static saveQuote(quote: IQuoteEntry, claimerIdentity: string): Action {
    return {
      payload: {
        quoteId: hash(quote),
        claimerAddress: claimerIdentity,
        quote,
      },
      type: Store.ACTIONS.SAVE_QUOTE,
    }
  }

  public static saveAgreedQuote(quote: IQuoteEntry): Action {
    return {
      payload: {
        quoteId: hash(quote),
        quote,
      },
      type: Store.ACTIONS.SAVE_AGREED_QUOTE,
    }
  }

  public static removeQuote(quoteId: Entry['quoteId']): Action {
    return {
      payload: quoteId,
      type: Store.ACTIONS.REMOVE_QUOTE,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      quotes: Immutable.Map<string, Entry>(),
    })(obj)
  }

  private static ACTIONS = {
    SAVE_QUOTE: 'client/quotes/SAVE_QUOTE',
    REMOVE_QUOTE: 'client/quotes/UPDATE_QUOTE',
    SAVE_AGREED_QUOTE: 'client/quotes/SAVE_AGREED_QUOTE',
  }
}

const getAllQuotes = (state: ReduxState): Entry[] =>
  state.quotes
    .get('quotes')
    .toList()
    .toArray()

const getAllMyQuotes = createSelector(
  [Wallet.getSelectedIdentity, getAllQuotes],
  (selectedIdentity: IMyIdentity, entries: Entry[]) => {
    return entries.filter((entry: Entry) => {
      return (
        (entry &&
          entry.quote &&
          entry.claimerAddress === selectedIdentity.identity.address) ||
        (entry &&
          entry.quote &&
          entry.quote.attesterAddress === selectedIdentity.identity.address)
      )
    })
  }
)

const getQuoteHash = (
  state: ReduxState,
  quoteId: Entry['quoteId']
): Entry['quoteId'] => quoteId

const getQuoteByQuoteHash = createSelector(
  [getAllMyQuotes, getQuoteHash],
  (entries: Entry[], quoteId: Entry['quoteId']) =>
    entries.filter((entry: Entry) => entry.quoteId === quoteId)
)

const getQuote = createSelector(
  [getQuoteHash, getAllMyQuotes],
  (quoteId: Entry['quoteId'], entries: Entry[]) => {
    return entries.find((entry: Entry) => entry.quoteId === quoteId)
  }
)

export { Store, getAllMyQuotes, getQuoteByQuoteHash, getQuote, hash }
