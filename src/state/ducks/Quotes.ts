import Immutable from 'immutable'
import { createSelector } from 'reselect'
import * as sdk from '@kiltprotocol/sdk-js'

import KiltAction from '../../types/Action'
import { State as ReduxState } from '../PersistentStore'

const DEFAULT_BLOCK_HASH: string = ''

interface SaveAction extends KiltAction {
  payload: Entry
}

interface RemoveAction extends KiltAction {
  payload: sdk.IQuote
}

type Action = SaveAction | RemoveAction

type Entry = {
  quote: sdk.IQuote
}

type State = {
  quotes: Immutable.Map<string, Entry>
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  quotes: Array<sdk.IQuote>
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const serialized: SerializedState = {
      quotes: [],
    }

    serialized.quotes = state
      .get('quotes')
      .toList()
      .map(quoteEntry => {
        return {
          attesterAddress: JSON.stringify(quoteEntry.attesterAddress),
          cTypeHash: JSON.stringify(quoteEntry.cTypeHash),
          cost: JSON.stringify(quoteEntry.cost),
          currency: JSON.stringify(quoteEntry.currency),
          termsAndConditions: JSON.stringify(quoteEntry.termsAndConditions),
          timeframe: JSON.stringify(quoteEntry.timeframe),
        }
      })
      .toArray()

    return serialized
  }

  public static deserialize(
    quotesStateSerialized: SerializedState
  ): ImmutableState {
    return Store.createState({
      quotes: Immutable.Map(quotesStateSerialized),
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.SAVE_QUOTES: {
        return state.setIn(['quotes'], (action as SaveAction).payload)
      }
      case Store.ACTIONS.REMOVE_QUOTES: {
        return state.setIn(['quotes'], (action as RemoveAction).payload)
      }
      default:
        return state
    }
  }

  public static saveQuotes(quotes: any): Action {
    return {
      payload: quotes,
      type: Store.ACTIONS.SAVE_QUOTES,
    }
  }

  public static removeQuotes(quotes: any): Action {
    return {
      payload: quotes,
      type: Store.ACTIONS.REMOVE_QUOTES,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      quotes: Immutable.Map<string, Entry>(),
    } as State)(obj)
  }

  private static ACTIONS = {
    SAVE_QUOTES: 'quotes/SAVE_QUOTES',
    REMOVE_QUOTES: 'quotes/UPDATE_QUOTES',
  }
}

export { Store, ImmutableState, SerializedState, Action, DEFAULT_BLOCK_HASH }
