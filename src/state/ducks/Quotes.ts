import Immutable from 'immutable'
import { createSelector } from 'reselect'
import * as sdk from '@kiltprotocol/sdk-js'
import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { State as ReduxState } from '../PersistentStore'
import { notifyFailure, notifySuccess } from '../../services/FeedbackService'
import * as Wallet from './Wallet'
import { MyIdentity } from '../../types/Contact'

interface SaveAction extends KiltAction {
  payload: {
    created: number
    claimerAddress: string
    quote: sdk.IQuoteAttesterSigned | sdk.IQuoteAgreement
  }
}

interface RemoveAction extends KiltAction {
  payload: sdk.IQuoteAttesterSigned['attesterSignature']
}

type Action = SaveAction | RemoveAction

type Entry = {
  created: number
  claimerAddress: string
  quote: sdk.IQuoteAttesterSigned | sdk.IQuoteAgreement
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
        created: quoteData.created,
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
        const quote: sdk.IQuoteAttesterSigned | sdk.IQuoteAttesterSigned =
          quoteAsJson.quote
        const quoteEntry: Entry = {
          created: quoteAsJson.created,
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
        const quoteEntry: Entry = (action as SaveAction).payload
        console.log('save_quote Action', state, action.payload)

        return state.update('quote', quotes => {
          return quotes
            .filter((entry: Entry) => {
              return (
                entry.quote.attesterSignature !==
                quoteEntry.quote.attesterSignature
              )
            })
            .concat(quoteEntry)
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

  public static saveQuote(
    quote: sdk.IQuoteAttesterSigned | sdk.IQuoteAgreement,
    claimerIdentity: string
  ): Action {
    notifySuccess(`Quote created by ${claimerIdentity} has been successful`)
    return {
      payload: {
        created: Date.now(),
        claimerAddress: claimerIdentity,
        quote,
      },
      type: Store.ACTIONS.SAVE_QUOTE,
    }
  }

  public static removeQuote(quotes: any): Action {
    return {
      payload: quotes,
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

const _getQuote = (state: ReduxState, created: Entry['created']) =>
  state.quotes.get('quote').get(created)

const getQuote = createSelector(
  [_getQuote],
  (entry: Entry) => entry
)

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

export {
  Store,
  ImmutableState,
  SerializedState,
  Action,
  Entry,
  getAllMyQuotes,
  getQuote,
}
