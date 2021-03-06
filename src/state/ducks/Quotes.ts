import Immutable from 'immutable'
import { createSelector } from 'reselect'
import { IQuoteAgreement, IQuoteAttesterSigned } from '@kiltprotocol/types'
import { UUID } from '@kiltprotocol/utils'

import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { State as ReduxState } from '../PersistentStore'
import * as Wallet from './Wallet'
import { IMyIdentity } from '../../types/Contact'

export type QuoteEntry = IQuoteAgreement | IQuoteAttesterSigned

interface ISaveQuoteAction extends KiltAction {
  payload: {
    quoteId: Entry['quoteId']
    owner: string
    quote: QuoteEntry
  }
}

interface IRemoveAction extends KiltAction {
  payload: IQuoteAttesterSigned['attesterSignature']
}

export type Action = IRemoveAction | ISaveQuoteAction

export type Entry = {
  quoteId: string
  owner: string
  quote: QuoteEntry
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
    const quoteEntries: Record<string, Entry> = {}

    quoteStateSerialized.quotes.forEach((serializedQuote) => {
      try {
        const quoteAsJson = JSON.parse(JSON.stringify(serializedQuote))

        const quoteEntry: Entry = {
          quoteId: quoteAsJson.quoteId,
          owner: quoteAsJson.owner,
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
        const { quoteId, quote, owner } = (action as ISaveQuoteAction).payload

        return state.setIn(['quotes', quoteId], {
          quoteId,
          owner,
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

  public static saveAttestersQuote(
    quote: QuoteEntry,
    ownerAddress: string
  ): Action {
    return {
      payload: {
        quoteId: UUID.generate(),
        owner: ownerAddress,
        quote,
      },
      type: Store.ACTIONS.SAVE_QUOTE,
    }
  }

  public static saveAgreedQuote(
    quote: QuoteEntry,
    ownerAddress: string
  ): Action {
    return {
      payload: {
        quoteId: UUID.generate(),
        owner: ownerAddress,
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
    REMOVE_QUOTE: 'client/quotes/UPDATE_QUOTE',
    SAVE_QUOTE: 'client/quotes/SAVE_QUOTE',
  }
}

const getAllQuotes = (state: ReduxState): Entry[] =>
  state.quotes.get('quotes').toList().toArray()

const getAllMyQuotes = createSelector(
  [Wallet.getSelectedIdentity, getAllQuotes],
  (selectedIdentity: IMyIdentity | undefined, entries: Entry[]) => {
    return entries.filter((entry: Entry) => {
      return (
        entry &&
        entry.quote &&
        entry.owner === selectedIdentity?.identity.address
      )
    })
  }
)

const getQuoteByID = (
  state: ReduxState,
  quoteId: Entry['quoteId']
): Entry['quoteId'] => quoteId

const getQuoteByQuoteID = createSelector(
  [getAllMyQuotes, getQuoteByID],
  (entries: Entry[], quoteId: Entry['quoteId']) =>
    entries.filter((entry: Entry) => entry.quoteId === quoteId)
)

const getQuote = createSelector(
  [getQuoteByID, getAllMyQuotes],
  (quoteId: Entry['quoteId'], entries: Entry[]) => {
    return entries.find((entry: Entry) => entry.quoteId === quoteId)
  }
)

export { Store, getAllMyQuotes, getQuoteByQuoteID, getQuote }
