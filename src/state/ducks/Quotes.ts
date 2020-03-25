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

function hash(quote: QuoteEntry): string {
  return sdk.Crypto.hashStr(JSON.stringify(quote))
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
  quote: Immutable.List<Entry>
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  quote: string[]
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const serialized: SerializedState = {
      quote: [],
    }

    serialized.quote = state
      .get('quote')
      .toList()
      .map((quoteEntry: Entry) => {
        return JSON.stringify(quoteEntry)
      })
      .toArray()

    return serialized
  }

  public static deserialize(
    quoteStateSerialized: SerializedState
  ): ImmutableState {
    if (!quoteStateSerialized) {
      const quoteData = JSON.parse(JSON.stringify(quoteStateSerialized))
      const quoteEntry: Entry = {
        quoteId: quoteData.quoteId,
        claimerAddress: quoteData.claimerAddress,
        quote: quoteData.quote,
      }
      return Store.createState({
        quote: Immutable.List([quoteEntry]),
      })
    }

    const quoteEntries: Entry[] = []
    quoteStateSerialized.quote.forEach(serializedQuote => {
      try {
        const quoteAsJson = JSON.parse(serializedQuote)
        const quote: QuoteEntry = quoteAsJson.quote
        const quoteEntry: Entry = {
          quoteId: quoteAsJson.quoteId,
          claimerAddress: quoteAsJson.claimerAddress,
          quote: quote,
        }
        quoteEntries.push(quoteEntry)
      } catch (e) {
        errorService.log({
          error: e,
          message: '',
          origin: 'Quotes.deserialize()',
        })
      }
    })

    return Store.createState({
      quote: Immutable.List(quoteEntries),
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
        console.log('save_quote Action', state, {
          quoteId,
          claimerAddress,
          quote,
        })

        return state.setIn(['quote', quoteId], {
          quoteId,
          claimerAddress,
          quote,
        })
      }
      case Store.ACTIONS.REMOVE_QUOTE: {
        // const attesterSignature: sdk.IQuoteAttesterSigned['attesterSignature'] = (action as RemoveAction)
        //   .payload
        // return state.set(
        //   'quotes',
        //   state.get('quotes').filter((entry: Entry) => {
        //     return entry.quote.attesterSignature !== attesterSignature
        //   })
        // )
        console.log('Remove_Quotes Action', state, action.payload)

        return state
      }
      default:
        return state
    }
  }

  public static saveQuote(quote: QuoteEntry, claimerIdentity: string): Action {
    notifySuccess(`Quote created by ${claimerIdentity} has been successful`)
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
      quote: Immutable.List<Entry>(),
    })(obj)
  }

  private static ACTIONS = {
    SAVE_QUOTE: 'quotes/SAVE_QUOTE',
    REMOVE_QUOTE: 'quotes/UPDATE_QUOTE',
  }
}

const _getAllMyQuotes = (state: ReduxState) =>
  state.quotes
    .get('quote')
    .toList()
    .toArray()

const getAllMyQuotes = createSelector(
  [Wallet.getSelectedIdentity, _getAllMyQuotes],
  (selectedIdentity: MyIdentity, entries: Entry[]) => {
    return entries.filter((entry: Entry) => {
      return (
        entry &&
        entry.quote &&
        entry.claimerAddress === selectedIdentity.identity.address
      )
    })
  }
)

const _getQuoteHash = (state: ReduxState, quote: QuoteEntry): string =>
  hash(quote)

const getQuote = createSelector(
  [_getQuoteHash, getAllMyQuotes],
  (quoteId: string, entries: Entry[]) => {
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
  getQuote,
}
