import Immutable from 'immutable'
import { createSelector } from 'reselect'
import * as sdk from '@kiltprotocol/sdk-js'
import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { State as ReduxState } from '../PersistentStore'
import { notifyFailure, notifySuccess } from '../../services/FeedbackService'

interface SaveAction extends KiltAction {
  payload: {
    created?: number
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
    // if (!quoteStateSerialized) {

    const quoteData = JSON.parse(JSON.stringify(quoteStateSerialized))
    const quoteEntry: Entry = {
      created: quoteData.created,
      claimerAddress: quoteData.claimerAddress,
      quote: quoteData.quote,
    }
    return Store.createState({
      quote: Immutable.List(),
    })
    // }

    // const quoteEntries: Entry[] = []
    // quoteStateSerialized.quote.forEach(serializedQuote => {
    //   try {
    //     const quoteAsJson = JSON.parse(serializedQuote)
    //     const quote: sdk.IQuoteAttesterSigned = quoteAsJson.quote
    //     const quoteEntry: Entry = {
    //       created: quoteAsJson.created,
    //       claimerAlias: quoteAsJson.claimerAddress,
    //       claimerAddress: quoteAsJson.claimerAddress,
    //       quote: quote,
    //     }
    //     quoteEntries.push(quoteEntry)
    //   } catch (e) {
    //     errorService.log({
    //       error: e,
    //       message: '',
    //       origin: 'Quotes.deserialize()',
    //     })
    //   }
    // })

    // return Store.createState({
    //   quotes: Immutable.List(quoteEntries),
    // })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.SAVE_QUOTE: {
        // const quoteEntry: Entry = (action as SaveAction).payload
        // return state.update('quotes', quotes => {
        //   return quotes
        //     .filter((entry: Entry) => {
        //       return (
        //         entry.quote.attesterSignature !==
        //         quoteEntry.quote.attesterSignature
        //       )
        //     })
        //     .concat(quoteEntry)
        // })
        console.log('save_quote Action', state, action.payload)
        return state
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

const _getAllMyQuotes = (state: ReduxState) =>
  state.quotes
    .get('quote')
    .toList()
    .toArray()

const getAllMyQuotes = createSelector(
  [_getAllMyQuotes],
  (entries: Entry[]) =>
    entries.sort((a, b) => {
      if (!a.created && !b.created) {
        return 0
      } else if (!a.created) {
        return 1
      } else if (!b.created) {
        return -1
      } else {
        return a.created - b.created
      }
    })
)

export { Store, ImmutableState, SerializedState, Action, Entry, getAllMyQuotes }
