import Immutable from 'immutable'
import { createSelector } from 'reselect'
import * as sdk from '@kiltprotocol/sdk-js'
import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { State as ReduxState } from '../PersistentStore'
import { notifyFailure, notifySuccess } from '../../services/FeedbackService'
import * as Wallet from './Wallet'
import { MyIdentity } from '../../types/Contact'

type QuoteEntry = sdk.IQuoteAttesterSigned | sdk.IQuoteAgreement // Could find a better name for this

function hash(quote: sdk.IQuote): string {
  const quoteHash = {
    attesterAddress: quote.attesterAddress,
    cTypeHash: quote.cTypeHash,
    cost: quote.cost,
    currency: quote.currency,
    termsAndConditions: quote.termsAndConditions,
  }
  return sdk.Crypto.hashStr(JSON.stringify(quoteHash))
}

interface SaveAction extends KiltAction {
  payload: {
    quoteId: Entry['quoteId']
    claimerAddress: string
    quote: QuoteEntry
  }
}

interface RemoveAction extends KiltAction {
  payload: sdk.IQuoteAttesterSigned['attesterSignature']
}

type Action = SaveAction | RemoveAction

type Entry = {
  quoteId: string
  claimerAddress: string
  quote: QuoteEntry
}

type State = {
  quotes: Immutable.Map<string, Entry>
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  quotes: Array<Entry>
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
        const quote: QuoteEntry = quoteAsJson.quote
        const quoteEntry: Entry = {
          quoteId: quoteAsJson.quoteId,
          claimerAddress: quoteAsJson.claimerAddress,
          quote: quote,
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
        } = (action as SaveAction).payload

        return state.setIn(['quotes', quoteId], {
          quoteId,
          claimerAddress,
          quote,
        })
      }
      case Store.ACTIONS.REMOVE_QUOTE: {
        return state.deleteIn(['quotes', (action as RemoveAction).payload])

        return state
      }
      default:
        return state
    }
  }

  public static saveQuote(quote: QuoteEntry, claimerIdentity: string): Action {
    return {
      payload: {
        quoteId: hash(quote),
        claimerAddress: claimerIdentity,
        quote,
      },
      type: Store.ACTIONS.SAVE_QUOTE,
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
  }
}

const _getAllQuotes = (state: ReduxState) =>
  state.quotes
    .get('quotes')
    .toList()
    .toArray()

const getAllMyQuotes = createSelector(
  [Wallet.getSelectedIdentity, _getAllQuotes],
  (selectedIdentity: MyIdentity, entries: Entry[]) => {
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

const _getQuoteHash = (
  state: ReduxState,
  quoteId: Entry['quoteId']
): Entry['quoteId'] => quoteId

const getQuoteByQuoteHash = createSelector(
  [getAllMyQuotes, _getQuoteHash],
  (entries: Entry[], quoteId: Entry['quoteId']) =>
    entries.filter((entry: Entry) => entry.quoteId === quoteId)
)

const getQuote = createSelector(
  [_getQuoteHash, getAllMyQuotes],
  (quoteId: Entry['quoteId'], entries: Entry[]) => {
    return entries.find((entry: Entry) => entry.quoteId === quoteId)
  }
)

export {
  Store,
  QuoteEntry,
  ImmutableState,
  SerializedState,
  Action,
  Entry,
  getAllMyQuotes,
  getQuoteByQuoteHash,
  getQuote,
  hash,
}
