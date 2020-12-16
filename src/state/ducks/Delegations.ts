import {
  IDelegationBaseNode,
  IDelegationNode,
  IDelegationRootNode,
} from '@kiltprotocol/sdk-js'
import Immutable from 'immutable'
import { createSelector } from 'reselect'
import { AnyJson } from '@polkadot/types/types'
import KiltAction from '../../types/Action'
import { IMyIdentity } from '../../types/Contact'
import { State as ReduxState } from '../PersistentStore'
import * as Wallet from './Wallet'

export enum DelegationType {
  Root = 'root',
  Node = 'node',
}

export interface IMyDelegation {
  account: IDelegationBaseNode['account']
  id: IDelegationBaseNode['id']
  metaData: {
    alias: string | number | true | AnyJson | undefined
  }
  type: DelegationType
  rootId?: IDelegationNode['rootId']
  permissions?: IDelegationNode['permissions']
  parentId?: IDelegationNode['parentId']
  cTypeHash: IDelegationRootNode['cTypeHash']
  revoked: IDelegationBaseNode['revoked']
  isPCR?: boolean
}

interface ISaveAction extends KiltAction {
  payload: IMyDelegation
}

interface IRemoveAction extends KiltAction {
  payload: IMyDelegation
}

interface IRevokeAction extends KiltAction {
  payload: IMyDelegation['id']
}

export type Action = ISaveAction | IRemoveAction | IRevokeAction

export type Entry = IMyDelegation

type State = {
  delegations: Immutable.List<IMyDelegation>
}

export type ImmutableState = Immutable.Record<State>

export type SerializedState = {
  delegations: string[]
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const store: SerializedState = {
      delegations: [],
    }
    store.delegations = state
      .get('delegations')
      .map((myDelegation: IMyDelegation) => {
        return JSON.stringify(myDelegation)
      })
      .toArray()

    return store
  }

  public static deserialize(serializedState: SerializedState): ImmutableState {
    const delegations: IMyDelegation[] =
      serializedState &&
      serializedState.delegations &&
      Array.isArray(serializedState.delegations)
        ? serializedState.delegations.map((serialized: string) => {
            return JSON.parse(serialized) as IMyDelegation
          })
        : []

    return Store.createState({
      delegations: Immutable.List(delegations),
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.SAVE_DELEGATION: {
        const myDelegation: IMyDelegation = (action as ISaveAction).payload
        return state.mergeIn(['delegations'], [myDelegation])
      }
      case Store.ACTIONS.REMOVE_DELEGATION: {
        const myDelegationToRemove: IMyDelegation = (action as IRemoveAction)
          .payload
        return state.set(
          'delegations',
          state
            .get('delegations')
            .filter((entry: Entry) => entry.id !== myDelegationToRemove.id)
        )
      }
      case Store.ACTIONS.REVOKE_DELEGATION: {
        const delegationId: IMyDelegation['id'] = (action as IRevokeAction)
          .payload
        const index: number = state
          .get('delegations')
          .map((delegation: IMyDelegation) => delegation.id)
          .indexOf(delegationId)
        return state.updateIn(['delegations', index, 'revoked'], () => true)
      }
      default:
        return state
    }
  }

  public static saveDelegationAction(myDelegation: IMyDelegation): ISaveAction {
    return {
      payload: myDelegation,
      type: Store.ACTIONS.SAVE_DELEGATION,
    }
  }

  public static revokeDelegationAction(id: IMyDelegation['id']): IRevokeAction {
    return {
      payload: id,
      type: Store.ACTIONS.REVOKE_DELEGATION,
    }
  }

  public static removeDelegationAction(
    myDelegation: IMyDelegation
  ): IRemoveAction {
    return {
      payload: myDelegation,
      type: Store.ACTIONS.REMOVE_DELEGATION,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      delegations: Immutable.List<IMyDelegation>(),
    } as State)(obj)
  }

  private static ACTIONS = {
    REMOVE_DELEGATION: 'client/delegations/REMOVE_DELEGATION',
    REVOKE_DELEGATION: 'client/delegations/REVOKE_DELEGATION',
    SAVE_DELEGATION: 'client/delegations/SAVE_DELEGATION',
  }
}

const getAllStateDelegations = (state: ReduxState): IMyDelegation[] =>
  state.delegations.get('delegations').toArray()

const getAllDelegations = createSelector(
  [Wallet.getSelectedIdentity, getAllStateDelegations],
  (selectedIdentity: IMyIdentity, myDelegations: IMyDelegation[]) => {
    return myDelegations.filter(
      (myDelegation: IMyDelegation) =>
        myDelegation.account === selectedIdentity.identity.address
    )
  }
)

const getRootDelegations = createSelector(
  [getAllDelegations],
  (myDelegations: IMyDelegation[]) => {
    return myDelegations.filter(
      (myDelegation: IMyDelegation) => myDelegation.type === DelegationType.Root
    )
  }
)

const getDelegations = createSelector(
  [getAllDelegations],
  (myDelegations: IMyDelegation[]) => {
    return myDelegations.filter(
      (myDelegation: IMyDelegation) => myDelegation.type !== DelegationType.Root
    )
  }
)

const getDelegationId = (
  state: ReduxState,
  delegationId: IMyDelegation['id']
): string => delegationId

const getDelegation = createSelector(
  [getAllDelegations, getDelegationId],
  (myDelegations: IMyDelegation[], delegationId: IMyDelegation['id']) =>
    myDelegations.find(
      (myDelegation: IMyDelegation) => myDelegation.id === delegationId
    )
)

export {
  Store,
  getAllDelegations,
  getRootDelegations,
  getDelegations,
  getDelegation,
}
