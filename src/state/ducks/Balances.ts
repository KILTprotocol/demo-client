import Immutable from 'immutable'
import { createSelector } from 'reselect'
import KiltAction from '../../types/Action'
import { MyIdentity } from '../../types/Contact'
import { State as ReduxState } from '../PersistentStore'

interface UpdateAction extends KiltAction {
  payload: {
    address: MyIdentity['identity']['address']
    balance: number
  }
}

interface RemoveAction extends KiltAction {
  payload: MyIdentity['identity']['address']
}

type Action = UpdateAction | RemoveAction

type State = {
  balances: Immutable.Map<MyIdentity['identity']['address'], number>
}

type ImmutableState = Immutable.Record<State>

class Store {
  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.UPDATE_BALANCE: {
        const { address, balance } = (action as UpdateAction).payload
        return state.setIn(['balances', address], balance)
      }
      case Store.ACTIONS.REMOVE_BALANCE: {
        const address = (action as RemoveAction).payload
        return state.deleteIn(['identities', address])
      }
      default:
        return state
    }
  }

  public static updateBalance(
    address: MyIdentity['identity']['address'],
    balance: number
  ): UpdateAction {
    return {
      payload: { address, balance },
      type: Store.ACTIONS.UPDATE_BALANCE,
    }
  }

  public static removeBalance(
    address: MyIdentity['identity']['address']
  ): RemoveAction {
    return {
      payload: address,
      type: Store.ACTIONS.REMOVE_BALANCE,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      balances: Immutable.Map<MyIdentity['identity']['address'], number>(),
    } as State)(obj)
  }

  private static ACTIONS = {
    REMOVE_BALANCE: 'balances/REMOVE_BALANCE',
    UPDATE_BALANCE: 'balances/UPDATE_BALANCE',
  }
}

const _getBalances = (state: ReduxState) => {
  return state.balances.get('balances')
}

const getBalances = createSelector(
  [_getBalances],
  (balances: Immutable.Map<string, number>) => balances
)

const _getBalance = (
  state: ReduxState,
  address: MyIdentity['identity']['address']
) => state.balances.get('balances').get(address)

const getBalance = createSelector(
  [_getBalance],
  (entry: number) => entry
)

export { Store, ImmutableState, Action, getBalance, getBalances }
