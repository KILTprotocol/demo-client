import Immutable from 'immutable'
import { createSelector } from 'reselect'

import KiltAction from '../../types/Action'
import { State as ReduxState } from '../PersistentStore'

const DEFAULT_BLOCK_HASH = ''

interface IParameters {
  blockHash: string
}

interface IUpdateAction extends KiltAction {
  payload: IParameters
}

export type Action = IUpdateAction

type State = {
  parameters: IParameters
}

export type ImmutableState = Immutable.Record<State>

export type SerializedState = {
  parameters: Partial<IParameters>
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const serialized: SerializedState = {
      parameters: {},
    }

    serialized.parameters = state.get('parameters')
    return serialized
  }

  public static deserialize(parameters: SerializedState): ImmutableState {
    if (!parameters) {
      return Store.createState({
        parameters: Store.getDefaults(),
      })
    }

    return Store.createState({
      parameters: parameters.parameters as IParameters,
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.UPDATE_PARAMETERS: {
        return state.setIn(['parameters'], action.payload)
      }
      default:
        return state
    }
  }

  public static updateParameters(parameters: IParameters): IUpdateAction {
    return {
      payload: parameters,
      type: Store.ACTIONS.UPDATE_PARAMETERS,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      parameters: Store.getDefaults(),
    } as State)(obj)
  }

  private static ACTIONS = {
    UPDATE_PARAMETERS: 'parameters/UPDATE_PARAMETERS',
  }

  private static getDefaults(): IParameters {
    return {
      blockHash: DEFAULT_BLOCK_HASH,
    } as IParameters
  }
}

const getStateParameters = (state: ReduxState): IParameters => {
  return state.parameters.get('parameters')
}

const getParameters = createSelector(
  [getStateParameters],
  (parameters: IParameters) => parameters
)

export { Store, getParameters, DEFAULT_BLOCK_HASH }
