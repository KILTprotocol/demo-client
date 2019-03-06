import * as sdk from '@kiltprotocol/prototype-sdk'
import Immutable from 'immutable'
import { createSelector } from 'reselect'

import KiltAction from '../../types/Action'
import { MyIdentity } from '../../types/Contact'
import { State as ReduxState } from '../PersistentStore'

export interface MyDelegationRoot {
  id: sdk.IDelegationBaseNode['id']
  metaData: {
    alias: string
  }
}

interface SaveAction extends KiltAction {
  payload: MyDelegationRoot
}

interface RemoveAction extends KiltAction {
  payload: MyDelegationRoot
}

type Action = SaveAction | RemoveAction

type Entry = MyDelegationRoot

type State = {
  delegations: Immutable.List<MyDelegationRoot>
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  delegations: string[]
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const store: SerializedState = {
      delegations: [],
    }
    console.log('state.get(delegations)', state.get('delegations'))

    store.delegations = state
      .get('delegations')
      .map((myDelegation: MyDelegationRoot) => {
        return JSON.stringify(myDelegation)
      })
      .toArray()

    return store
  }

  public static deserialize(serializedState: SerializedState): ImmutableState {
    const delegations: MyDelegationRoot[] = serializedState.delegations.map(
      (serialized: string) => {
        return JSON.parse(serialized) as MyDelegationRoot
      }
    )

    return Store.createState({
      delegations: Immutable.List(delegations),
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.SAVE_DELEGATION:
        const myDelegation: MyDelegationRoot = (action as SaveAction).payload
        return state.mergeIn(['delegations'], [myDelegation])
      case Store.ACTIONS.REMOVE_DELEGATION:
        const myDelegationToRemove: MyDelegationRoot = (action as RemoveAction)
          .payload
        return state.deleteIn(['delegations', myDelegationToRemove])
      default:
        return state
    }
  }

  public static saveDelegationAction(
    myDelegation: MyDelegationRoot
  ): SaveAction {
    return {
      payload: myDelegation,
      type: Store.ACTIONS.SAVE_DELEGATION,
    }
  }

  public static removeIdentityAction(
    myDelegation: MyDelegationRoot
  ): RemoveAction {
    return {
      payload: myDelegation,
      type: Store.ACTIONS.REMOVE_DELEGATION,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      delegations: Immutable.List<MyDelegationRoot>(),
    } as State)(obj)
  }

  private static ACTIONS = {
    REMOVE_DELEGATION: 'client/delegations/REMOVE_DELEGATION',
    SAVE_DELEGATION: 'client/delegations/SAVE_DELEGATION',
  }
}

const _getAllDelegations = (state: ReduxState) =>
  state.delegations
    .get('delegations')
    .toList()
    .toArray()

const getAllDelegations = createSelector(
  [_getAllDelegations],
  (entries: Entry[]) => entries
)

export {
  Store,
  ImmutableState,
  SerializedState,
  Entry,
  Action,
  getAllDelegations,
}
