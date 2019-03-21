import * as sdk from '@kiltprotocol/prototype-sdk'
import Immutable from 'immutable'
import { createSelector } from 'reselect'

import KiltAction from '../../types/Action'
import { State as ReduxState } from '../PersistentStore'

export enum DelegationType {
  Root = 'root',
  Node = 'node',
}

export interface MyDelegation {
  account: sdk.IDelegationBaseNode['account']
  id: sdk.IDelegationBaseNode['id']
  metaData: {
    alias: string
  }
  type: DelegationType
  rootId?: sdk.IDelegationNode['rootId']
  permissions?: sdk.IDelegationNode['permissions']
  parentId?: sdk.IDelegationNode['parentId']
  cTypeHash?: sdk.IDelegationRootNode['cTypeHash']
}

interface SaveAction extends KiltAction {
  payload: MyDelegation
}

interface RemoveAction extends KiltAction {
  payload: MyDelegation
}

type Action = SaveAction | RemoveAction

type Entry = MyDelegation

type State = {
  delegations: Immutable.List<MyDelegation>
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
    store.delegations = state
      .get('delegations')
      .map((myDelegation: MyDelegation) => {
        return JSON.stringify(myDelegation)
      })
      .toArray()

    return store
  }

  public static deserialize(serializedState: SerializedState): ImmutableState {
    const delegations: MyDelegation[] = serializedState.delegations.map(
      (serialized: string) => {
        return JSON.parse(serialized) as MyDelegation
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
        const myDelegation: MyDelegation = (action as SaveAction).payload
        return state.mergeIn(['delegations'], [myDelegation])
      case Store.ACTIONS.REMOVE_DELEGATION:
        const myDelegationToRemove: MyDelegation = (action as RemoveAction)
          .payload
        return state.set(
          'delegations',
          state
            .get('delegations')
            .filter((entry: Entry) => entry.id !== myDelegationToRemove.id)
        )
      default:
        return state
    }
  }

  public static saveDelegationAction(myDelegation: MyDelegation): SaveAction {
    return {
      payload: myDelegation,
      type: Store.ACTIONS.SAVE_DELEGATION,
    }
  }

  public static removeDelegationAction(
    myDelegation: MyDelegation
  ): RemoveAction {
    return {
      payload: myDelegation,
      type: Store.ACTIONS.REMOVE_DELEGATION,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      delegations: Immutable.List<MyDelegation>(),
    } as State)(obj)
  }

  private static ACTIONS = {
    REMOVE_DELEGATION: 'client/delegations/REMOVE_DELEGATION',
    SAVE_DELEGATION: 'client/delegations/SAVE_DELEGATION',
  }
}

const _getAllDelegations = (state: ReduxState) =>
  state.delegations.get('delegations').toArray()

const getDelegations = createSelector(
  [_getAllDelegations],
  (entries: Entry[]) => {
    return entries
  }
)

export { Store, ImmutableState, SerializedState, Entry, Action, getDelegations }
